import { Capacitor } from '@capacitor/core';
import useSpeechToTextBrowser from './useSpeechToTextBrowser';
import useSpeechToTextExternal from './useSpeechToTextExternal';
import useSpeechToTextCapacitor from './useSpeechToTextCapacitor';
import useGetAudioSettings from './useGetAudioSettings';

const useSpeechToText = (
  setText: (text: string) => void,
  onTranscriptionComplete: (text: string) => void,
): {
  isLoading?: boolean;
  isListening?: boolean;
  stopRecording: () => void | (() => Promise<void>);
  startRecording: () => void | (() => Promise<void>);
} => {
  const { speechToTextEndpoint } = useGetAudioSettings();
  const externalSpeechToText = speechToTextEndpoint === 'external';
  const isNativePlatform = Capacitor.isNativePlatform();

  const {
    isListening: speechIsListeningBrowser,
    isLoading: speechIsLoadingBrowser,
    startRecording: startSpeechRecordingBrowser,
    stopRecording: stopSpeechRecordingBrowser,
  } = useSpeechToTextBrowser(setText, onTranscriptionComplete);

  const {
    isListening: speechIsListeningExternal,
    isLoading: speechIsLoadingExternal,
    externalStartRecording: startSpeechRecordingExternal,
    externalStopRecording: stopSpeechRecordingExternal,
  } = useSpeechToTextExternal(setText, onTranscriptionComplete);

  const {
    isListening: speechIsListeningCapacitor,
    isLoading: speechIsLoadingCapacitor,
    externalStartRecording: startSpeechRecordingCapacitor,
    externalStopRecording: stopSpeechRecordingCapacitor,
  } = useSpeechToTextCapacitor(setText, onTranscriptionComplete);

  // Use Capacitor-enhanced version on native platforms with external STT
  // Otherwise use standard implementations
  const useCapacitorVersion = isNativePlatform && externalSpeechToText;

  const isListening = useCapacitorVersion
    ? speechIsListeningCapacitor
    : externalSpeechToText
      ? speechIsListeningExternal
      : speechIsListeningBrowser;
  const isLoading = useCapacitorVersion
    ? speechIsLoadingCapacitor
    : externalSpeechToText
      ? speechIsLoadingExternal
      : speechIsLoadingBrowser;

  const startRecording = useCapacitorVersion
    ? startSpeechRecordingCapacitor
    : externalSpeechToText
      ? startSpeechRecordingExternal
      : startSpeechRecordingBrowser;
  const stopRecording = useCapacitorVersion
    ? stopSpeechRecordingCapacitor
    : externalSpeechToText
      ? stopSpeechRecordingExternal
      : stopSpeechRecordingBrowser;

  return {
    isLoading,
    isListening,
    stopRecording,
    startRecording,
  };
};

export default useSpeechToText;
