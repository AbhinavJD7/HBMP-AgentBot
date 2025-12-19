import React from 'react';
import { useNavigate } from 'react-router-dom';
import MarkdownLite from '~/components/Chat/Messages/Content/MarkdownLite';
import { useLocalize } from '~/hooks';
import termsContent from '../../../TERMS_AND_CONDITIONS.md?raw';

export default function Terms() {
    const navigate = useNavigate();
    const localize = useLocalize();

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {localize('com_ui_terms_and_conditions')}
                    </h1>
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        {localize('com_ui_close')}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-4xl px-4 py-8">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <MarkdownLite content={termsContent} codeExecution={false} />
                    </div>
                </div>
            </div>
        </div>
    );
}
