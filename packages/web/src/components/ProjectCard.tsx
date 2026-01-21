
import { h } from 'preact';
import { ProjectWithStats } from '../stores';

export interface ProjectMeta {
    aiStatus: 'Idle' | 'Running' | 'Blocked' | 'Failing';
    risk: 'Green' | 'Amber' | 'Red';
    lanes: {
        shaping: number;
        betting: number;
        active: number;
        shipped: number;
    };
    activeBets: number;
    lastEvent: string;
    thrash: {
        cuts: number;
        retries: number;
    };
    blockers: {
        count: number;
        reason?: string;
    };
}

export type ProjectWithMeta = ProjectWithStats & { meta: ProjectMeta };

interface ProjectCardProps {
    project: ProjectWithMeta;
    onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
    const { meta } = project;

    const aiStatusColors = {
        Idle: 'text-text-medium',
        Running: 'text-brand-primary',
        Blocked: 'text-orange-400',
        Failing: 'text-red-500',
    };

    const riskColors = {
        Green: 'text-brand-primary',
        Amber: 'text-orange-400',
        Red: 'text-red-500',
    };

    return (
        <div
            onClick={onClick}
            className="group flex flex-col bg-bg-surface border border-border-subtle rounded-lg p-5 hover:border-brand-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md h-full"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-text-high tracking-tight group-hover:text-brand-primary transition-colors">
                    {project.name}
                </h3>
            </div>

            {/* AI & Risk Status Row */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-text-medium font-medium">AI:</span>
                    <span className={`font-medium ${aiStatusColors[meta.aiStatus]}`}>
                        {meta.aiStatus}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-text-medium font-medium">Risk:</span>
                    <span className={`font-medium ${riskColors[meta.risk]}`}>
                        {meta.risk}
                    </span>
                </div>
            </div>

            {/* Lanes Stats */}
            <div className="bg-bg-base rounded border border-border-subtle p-3 mb-4">
                <div className="flex justify-between items-center text-xs font-mono text-text-medium">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase text-text-low">Shaping</span>
                        <span className="text-text-high font-semibold text-sm">{meta.lanes.shaping}</span>
                    </div>
                    <div className="w-px h-6 bg-border-subtle"></div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase text-text-low">Betting</span>
                        <span className="text-text-high font-semibold text-sm">{meta.lanes.betting}</span>
                    </div>
                    <div className="w-px h-6 bg-border-subtle"></div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase text-text-low">Active</span>
                        <span className="text-text-high font-semibold text-sm">{meta.lanes.active}</span>
                    </div>
                    <div className="w-px h-6 bg-border-subtle"></div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase text-text-low">Shipped</span>
                        <span className="text-text-high font-semibold text-sm">{meta.lanes.shipped}</span>
                    </div>
                </div>
            </div>

            {/* Details List */}
            <div className="space-y-2 mb-6 flex-1 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-text-medium">Active bets:</span>
                    <span className="text-text-high font-medium">{meta.activeBets}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-medium">Last event:</span>
                    <span className="text-text-high font-medium text-right truncate max-w-[140px]" title={meta.lastEvent}>
                        {meta.lastEvent}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-medium">Thrash:</span>
                    <span className="text-text-high font-medium">
                        cuts {meta.thrash.cuts} <span className="text-text-low">|</span> retries {meta.thrash.retries}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-medium">Blockers:</span>
                    <span className={`font-medium ${meta.blockers.count > 0 ? 'text-red-400' : 'text-text-high'}`}>
                        {meta.blockers.count}
                        {meta.blockers.reason && (
                            <span className="text-text-low text-xs ml-1">({meta.blockers.reason})</span>
                        )}
                    </span>
                </div>
            </div>

            {/* Footer Action */}
            <button
                className="w-full mt-auto py-2 px-4 rounded border border-border-default text-text-medium text-sm font-medium hover:border-text-high hover:text-text-high transition-colors bg-transparent"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                Open Project
            </button>
        </div>
    );
}
