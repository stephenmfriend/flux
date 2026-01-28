import { useState, useEffect } from 'preact/hooks'
import { Modal } from './Modal'
import { getProjectContext, updateProjectContext, addProjectContextNote } from '../stores'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ProjectContextEditorProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

export function ProjectContextEditor({ isOpen, onClose, projectId, projectName }: ProjectContextEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState('')
  const [businessRules, setBusinessRules] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [newRule, setNewRule] = useState('')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadContext()
    }
  }, [isOpen, projectId])

  const loadContext = async () => {
    setLoading(true)
    try {
      const context = await getProjectContext(projectId)
      if (context) {
        setProblem(context.problem || '')
        setBusinessRules(context.businessRules || [])
        setNotes(context.notes || '')
      } else {
        setProblem('')
        setBusinessRules([])
        setNotes('')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProjectContext(projectId, {
        problem: problem.trim() || undefined,
        businessRules: businessRules.length > 0 ? businessRules : undefined,
        notes: notes || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const addRule = () => {
    if (newRule.trim()) {
      setBusinessRules([...businessRules, newRule.trim()])
      setNewRule('')
    }
  }

  const removeRule = (index: number) => {
    setBusinessRules(businessRules.filter((_, i) => i !== index))
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSaving(true)
    try {
      const result = await addProjectContextNote(projectId, newNote.trim())
      if (result?.context?.notes) {
        setNotes(result.context.notes)
      }
      setNewNote('')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Project Context">
        <div class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Context: ${projectName}`}>
      <div class="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Problem Statement */}
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Problem Statement</span>
          </label>
          <textarea
            class="textarea textarea-bordered h-24"
            placeholder="What problem is this project solving?"
            value={problem}
            onInput={(e) => setProblem((e.target as HTMLTextAreaElement).value)}
          />
          <label class="label">
            <span class="label-text-alt text-base-content/60">Help agents understand the context</span>
          </label>
        </div>

        {/* Business Rules */}
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Business Rules</span>
            <span class="label-text-alt">{businessRules.length} rules</span>
          </label>
          <div class="space-y-2">
            {businessRules.map((rule, i) => (
              <div key={i} class="flex items-start gap-2 bg-base-200 rounded-lg p-2">
                <span class="badge badge-sm badge-ghost mt-0.5">{i + 1}</span>
                <span class="flex-1 text-sm">{rule}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-square"
                  onClick={() => removeRule(i)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div class="flex gap-2">
              <input
                type="text"
                class="input input-bordered input-sm flex-1"
                placeholder="Add a business rule..."
                value={newRule}
                onInput={(e) => setNewRule((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
              />
              <button type="button" class="btn btn-sm btn-ghost" onClick={addRule}>
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <label class="label">
            <span class="label-text-alt text-base-content/60">Project-wide constraints for agents</span>
          </label>
        </div>

        {/* Session Notes */}
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Session Notes</span>
          </label>
          {notes ? (
            <div class="bg-base-200 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {notes}
            </div>
          ) : (
            <div class="bg-base-200 rounded-lg p-3 text-sm text-base-content/50 italic">
              No session notes yet
            </div>
          )}
          <div class="flex gap-2 mt-2">
            <input
              type="text"
              class="input input-bordered input-sm flex-1"
              placeholder="Add a note for future sessions..."
              value={newNote}
              onInput={(e) => setNewNote((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
            />
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              onClick={handleAddNote}
              disabled={saving || !newNote.trim()}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <label class="label">
            <span class="label-text-alt text-base-content/60">Cross-session learnings (timestamped)</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div class="modal-action">
        <button class="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span class="loading loading-spinner loading-sm"></span> : 'Save'}
        </button>
      </div>
    </Modal>
  )
}
