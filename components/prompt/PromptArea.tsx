'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

// --- Option Field Definitions ---
type OptionField = {
    id: string;
    name: string;
    placeholder: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

const optionFields: OptionField[] = [
    {
        id: 'keywords',
        name: '키워드',
        placeholder: '블로그 글에 포함할 키워드를 입력하세요...',
        icon: (props) => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
        ),
    },
    {
        id: 'critique',
        name: '나의 비평',
        placeholder: '이 주제에 대한 나의 의견이나 관점을 입력하세요...',
        icon: (props) => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
        ),
    },
    {
        id: 'reference_materials',
        name: '참고 자료',
        placeholder: '참고할 기사, 논문, 블로그 등의 내용을 입력하세요...',
        icon: (props) => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
        ),
    },
    {
        id: 'sources',
        name: '출처',
        placeholder: '출처 URL이나 자료명을 입력하세요...',
        icon: (props) => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
        ),
    },
];

// --- SVG Icons ---
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 5.25L12 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.75 12L12 5.25L5.25 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// --- PromptArea Component ---
export type PromptAreaProps = {
    onSubmit?: (prompt: string, options: Record<string, string>) => void | Promise<void>;
    disabled?: boolean;
    className?: string;
};

export function PromptArea({ onSubmit, disabled, className }: PromptAreaProps) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = React.useState('');
    const [activeFields, setActiveFields] = React.useState<Record<string, string>>({});
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Auto-resize textarea
    React.useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 300);
            textarea.style.height = `${newHeight}px`;
        }
    }, [value]);

    const handleSubmit = () => {
        if (!value.trim()) return;
        // Only include fields that have content
        const filledOptions: Record<string, string> = {};
        for (const [id, val] of Object.entries(activeFields)) {
            if (val.trim()) filledOptions[id] = val.trim();
        }
        onSubmit?.(value.trim(), filledOptions);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const addField = (fieldId: string) => {
        setActiveFields((prev) => ({ ...prev, [fieldId]: '' }));
        setIsMenuOpen(false);
    };

    const removeField = (fieldId: string) => {
        setActiveFields((prev) => {
            const next = { ...prev };
            delete next[fieldId];
            return next;
        });
    };

    const updateField = (fieldId: string, fieldValue: string) => {
        setActiveFields((prev) => ({ ...prev, [fieldId]: fieldValue }));
    };

    const hasValue = value.trim().length > 0 && !disabled;
    const availableFields = optionFields.filter((f) => !(f.id in activeFields));
    const activeFieldList = optionFields.filter((f) => f.id in activeFields);

    return (
        <div
            className={[
                'flex flex-col rounded-[28px] p-2 shadow-sm transition-colors bg-[#252525] border border-white/[0.06] cursor-text',
                className,
            ].filter(Boolean).join(' ')}
            onClick={() => textareaRef.current?.focus()}
        >
            {/* Main Textarea */}
            <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="어떤 블로그 글을 작성할까요? 아이디어를 알려주세요..."
                className="custom-scrollbar w-full resize-none border-0 bg-transparent p-4 text-white placeholder:text-white/30 focus:ring-0 focus-visible:outline-none min-h-[60px] text-base"
                style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system" }}
            />

            {/* Active Option Fields */}
            {activeFieldList.length > 0 && (
                <div className="flex flex-col gap-2 px-3 pb-2" onClick={(e) => e.stopPropagation()}>
                    {activeFieldList.map((field) => (
                        <div
                            key={field.id}
                            className="group flex items-start gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 transition-colors hover:border-white/[0.1]"
                        >
                            {/* Label */}
                            <div className="flex items-center gap-1.5 pt-1.5 shrink-0">
                                <field.icon className="h-4 w-4 text-[#22d3ee]/70" />
                                <span className="text-xs font-medium text-[#22d3ee]/70 whitespace-nowrap">
                                    {field.name}
                                </span>
                            </div>

                            {/* Text Input */}
                            <textarea
                                rows={1}
                                value={activeFields[field.id] || ''}
                                onChange={(e) => updateField(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className="flex-1 resize-none border-0 bg-transparent text-sm text-white/80 placeholder:text-white/20 focus:ring-0 focus-visible:outline-none min-h-[32px] py-1.5"
                                style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system" }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                                }}
                            />

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeField(field.id)}
                                className="shrink-0 p-1 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Bar */}
            <div className="mt-0.5 p-1 pt-0">
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Add Option Button */}
                    {availableFields.length > 0 && (
                        <PopoverPrimitive.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <PopoverPrimitive.Trigger asChild>
                                <button
                                    type="button"
                                    className="flex h-8 items-center gap-1.5 rounded-full px-3 text-sm text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/60 focus-visible:outline-none"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    옵션 추가
                                </button>
                            </PopoverPrimitive.Trigger>
                            <PopoverPrimitive.Portal>
                                <PopoverPrimitive.Content
                                    side="top"
                                    align="start"
                                    sideOffset={4}
                                    className="z-50 w-56 rounded-xl bg-[#252525] border border-white/[0.06] p-1.5 text-white shadow-xl outline-none animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                                >
                                    {availableFields.map((field) => (
                                        <button
                                            key={field.id}
                                            onClick={() => addField(field.id)}
                                            className="flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                                        >
                                            <field.icon className="h-4 w-4 text-white/40" />
                                            <div>
                                                <div className="text-sm">{field.name}</div>
                                                <div className="text-[11px] text-white/30 mt-0.5">{field.placeholder.slice(0, 30)}...</div>
                                            </div>
                                        </button>
                                    ))}
                                </PopoverPrimitive.Content>
                            </PopoverPrimitive.Portal>
                        </PopoverPrimitive.Root>
                    )}

                    {/* Send Button */}
                    <div className="ml-auto">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!hasValue}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none bg-[#22d3ee] text-black hover:bg-[#06b6d4] disabled:bg-white/10 disabled:text-white/20"
                        >
                            <SendIcon className="h-5 w-5" />
                            <span className="sr-only">전송</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
