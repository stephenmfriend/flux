import { h, ComponentChildren, VNode } from 'preact';

interface StandardPageHeaderProps {
    title: string;
    badge?: string; // e.g. "Active" badge next to title
    subtitle?: string; // e.g. "Day 8 of 42" or breadcrumb-like info
    toolbar?: ComponentChildren;
    className?: string;
}

export function StandardPageHeader({ title, badge, subtitle, toolbar, className = '' }: StandardPageHeaderProps) {
    return (
        <div className={`mt-8 mb-6 ${className}`}>
            {/* Title Row */}
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-semibold text-text-high flex items-center gap-3 tracking-tight">
                    {title}
                    {badge && (
                        <span className="text-xs bg-[#3ecf8e]/10 text-[#3ecf8e] px-2 py-1 rounded-xl font-semibold uppercase">
                            {badge}
                        </span>
                    )}
                </h2>
                {subtitle && (
                    <span className="text-text-medium text-sm ml-1 font-medium">
                        {subtitle}
                    </span>
                )}
            </div>

            {/* Toolbar Row */}
            {toolbar && (
                <div className="flex items-center gap-3">
                    {toolbar}
                </div>
            )}
        </div>
    );
}
