import { useReducer, useEffect } from "preact/hooks";
import { ConfirmModal } from "./ConfirmModal";
import { Modal } from "./Modal";
import { Input, Textarea } from "./Input";
import { Select } from "./FormControls";
import { Checkbox } from "./FormControls";
import { Button } from "./Button";
import { Badge } from "./Badge";
import {
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  deleteTaskComment,
  getEpics,
  getTasks,
  type TaskWithBlocked,
} from "../stores";
import type { Task, Epic, Status, TaskComment, Guardrail, TaskType } from "@flux/shared";
import { STATUSES, STATUS_CONFIG, PRIORITIES, PRIORITY_CONFIG, TASK_TYPES, TASK_TYPE_CONFIG, type Priority } from "@flux/shared";
import "./TaskForm.css";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  task?: Task; // If provided, edit mode; otherwise create mode
  projectId: string;
  defaultEpicId?: string; // Pre-select epic when creating new task
}

interface FormState {
  title: string;
  status: string;
  epicId: string;
  priority: Priority | undefined;
  type: TaskType;
  epics: Epic[];
  dependsOn: string[];
  availableTasks: TaskWithBlocked[];
  submitting: boolean;
  dependencyFilter: string;
  comments: TaskComment[];
  commentBody: string;
  commentSubmitting: boolean;
  blockedReason: string;
  deleteConfirmOpen: boolean;
  deleteCommentId: string | null;
  acceptanceCriteria: string[];
  newCriterion: string;
  guardrails: Guardrail[];
  newGuardrailNumber: string;
  newGuardrailText: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: "RESET_FORM"; defaultEpicId?: string }
  | { type: "LOAD_FORM_DATA"; epics: Epic[]; tasks: TaskWithBlocked[]; task?: Task; defaultEpicId?: string }
  | { type: "ADD_COMMENT"; comment: TaskComment }
  | { type: "REMOVE_COMMENT"; commentId: string }
  | { type: "TOGGLE_DEPENDENCY"; taskId: string }
  | { type: "ADD_CRITERION" }
  | { type: "REMOVE_CRITERION"; index: number }
  | { type: "ADD_GUARDRAIL" }
  | { type: "REMOVE_GUARDRAIL"; id: string };

const initialState: FormState = {
  title: "",
  status: "todo",
  epicId: "",
  priority: undefined,
  type: "task",
  epics: [],
  dependsOn: [],
  availableTasks: [],
  submitting: false,
  dependencyFilter: "",
  comments: [],
  commentBody: "",
  commentSubmitting: false,
  blockedReason: "",
  deleteConfirmOpen: false,
  deleteCommentId: null,
  acceptanceCriteria: [],
  newCriterion: "",
  guardrails: [],
  newGuardrailNumber: "",
  newGuardrailText: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "RESET_FORM":
      return {
        ...initialState,
        epics: state.epics,
        availableTasks: state.availableTasks,
        epicId: action.defaultEpicId ?? "",
      };

    case "LOAD_FORM_DATA":
      return {
        ...state,
        epics: action.epics,
        availableTasks: action.tasks,
        dependencyFilter: "",
        newCriterion: "",
        newGuardrailNumber: "",
        newGuardrailText: "",
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        ...(action.task !== undefined
          ? {
              title: action.task.title,
              status: action.task.status,
              epicId: action.task.epic_id ?? "",
              priority: action.task.priority,
              type: action.task.type ?? "task",
              dependsOn: [...action.task.depends_on],
              comments: action.task.comments !== undefined ? [...action.task.comments] : [],
              blockedReason: action.task.blocked_reason ?? "",
              acceptanceCriteria: action.task.acceptance_criteria !== undefined ? [...action.task.acceptance_criteria] : [],
              guardrails: action.task.guardrails !== undefined ? [...action.task.guardrails] : [],
            }
          : {
              title: "",
              status: "todo",
              epicId: action.defaultEpicId ?? "",
              priority: undefined,
              type: "task",
              dependsOn: [],
              comments: [],
              blockedReason: "",
              acceptanceCriteria: [],
              guardrails: [],
            }),
      };

    case "ADD_COMMENT":
      return {
        ...state,
        comments: [...state.comments, action.comment],
        commentBody: "",
      };

    case "REMOVE_COMMENT":
      return {
        ...state,
        comments: state.comments.filter((comment) => comment.id !== action.commentId),
      };

    case "TOGGLE_DEPENDENCY":
      return {
        ...state,
        dependsOn: state.dependsOn.includes(action.taskId)
          ? state.dependsOn.filter((id) => id !== action.taskId)
          : [...state.dependsOn, action.taskId],
      };

    case "ADD_CRITERION":
      if (state.newCriterion.trim() === "") return state;
      return {
        ...state,
        acceptanceCriteria: [...state.acceptanceCriteria, state.newCriterion.trim()],
        newCriterion: "",
      };

    case "REMOVE_CRITERION":
      return {
        ...state,
        acceptanceCriteria: state.acceptanceCriteria.filter((_, i) => i !== action.index),
      };

    case "ADD_GUARDRAIL": {
      const num = Math.floor(parseInt(state.newGuardrailNumber));
      if (isNaN(num) || num <= 0 || state.newGuardrailText.trim() === "") return state;
      return {
        ...state,
        guardrails: [...state.guardrails, { id: crypto.randomUUID(), number: num, text: state.newGuardrailText.trim() }],
        newGuardrailNumber: "",
        newGuardrailText: "",
      };
    }

    case "REMOVE_GUARDRAIL":
      return {
        ...state,
        guardrails: state.guardrails.filter((g) => g.id !== action.id),
      };

    default:
      return state;
  }
}

export function TaskForm({
  isOpen,
  onClose,
  onSave,
  task,
  projectId,
  defaultEpicId,
}: TaskFormProps) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const {
    title,
    status,
    epicId,
    priority,
    type,
    epics,
    dependsOn,
    availableTasks,
    submitting,
    dependencyFilter,
    comments,
    commentBody,
    commentSubmitting,
    blockedReason,
    deleteConfirmOpen,
    deleteCommentId,
    acceptanceCriteria,
    newCriterion,
    guardrails,
    newGuardrailNumber,
    newGuardrailText,
  } = state;

  const isEdit = task !== undefined;

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: "SET_FIELD", field: "deleteConfirmOpen", value: false });
      dispatch({ type: "SET_FIELD", field: "deleteCommentId", value: null });
      void loadFormData();
    } else {
      dispatch({ type: "SET_FIELD", field: "deleteConfirmOpen", value: false });
      dispatch({ type: "SET_FIELD", field: "deleteCommentId", value: null });
    }
  }, [isOpen, task, projectId, defaultEpicId]);

  const loadFormData = async () => {
    const [epicsData, tasksData] = await Promise.all([
      getEpics(projectId),
      getTasks(projectId),
    ]);
    const filteredTasks = task !== undefined ? tasksData.filter((t) => t.id !== task.id) : tasksData;
    dispatch({ type: "LOAD_FORM_DATA", epics: epicsData, tasks: filteredTasks, task, defaultEpicId });
  };

  const handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    if (title.trim() === "" || submitting) return;

    dispatch({ type: "SET_FIELD", field: "submitting", value: true });
    try {
      if (task !== undefined) {
        await updateTask(task.id, {
          title: title.trim(),
          status,
          epic_id: epicId !== "" ? epicId : undefined,
          priority: priority,
          type: type,
          depends_on: dependsOn,
          blocked_reason: blockedReason.trim() !== "" ? blockedReason.trim() : undefined,
          acceptance_criteria: acceptanceCriteria.length > 0 ? acceptanceCriteria : undefined,
          guardrails: guardrails.length > 0 ? guardrails : undefined,
        });
      } else {
        const newTask = await createTask(
          projectId,
          title.trim(),
          epicId !== "" ? epicId : undefined
        );
        const updates: Partial<Task> = {};
        if (priority !== undefined) updates.priority = priority;
        updates.type = type; // Always set type (defaults to 'task')
        if (dependsOn.length > 0) updates.depends_on = dependsOn;
        if (acceptanceCriteria.length > 0) updates.acceptance_criteria = acceptanceCriteria;
        if (guardrails.length > 0) updates.guardrails = guardrails;
        if (Object.keys(updates).length > 0) {
          await updateTask(newTask.id, updates);
        }
      }
      await onSave();
      onClose();
    } finally {
      dispatch({ type: "SET_FIELD", field: "submitting", value: false });
    }
  };

  const handleDelete = (): void => {
    if (task !== undefined && !submitting) {
      dispatch({ type: "SET_FIELD", field: "deleteConfirmOpen", value: true });
    }
  };

  const handleDeleteConfirmed = async (): Promise<void> => {
    if (task === undefined || submitting) return;
    dispatch({ type: "SET_FIELD", field: "submitting", value: true });
    try {
      await deleteTask(task.id);
      await onSave();
      onClose();
    } finally {
      dispatch({ type: "SET_FIELD", field: "submitting", value: false });
      dispatch({ type: "SET_FIELD", field: "deleteConfirmOpen", value: false });
    }
  };

  const handleAddComment = async (): Promise<void> => {
    if (task === undefined || commentBody.trim() === "" || commentSubmitting) return;
    dispatch({ type: "SET_FIELD", field: "commentSubmitting", value: true });
    try {
      const comment = await addTaskComment(task.id, commentBody.trim(), "user");
      dispatch({ type: "ADD_COMMENT", comment });
      await onSave();
    } finally {
      dispatch({ type: "SET_FIELD", field: "commentSubmitting", value: false });
    }
  };

  const handleDeleteComment = (commentId: string): void => {
    if (task === undefined || commentSubmitting) return;
    dispatch({ type: "SET_FIELD", field: "deleteCommentId", value: commentId });
  };

  const handleDeleteCommentConfirmed = async (): Promise<void> => {
    if (task === undefined || commentSubmitting || deleteCommentId === null) return;
    dispatch({ type: "SET_FIELD", field: "commentSubmitting", value: true });
    try {
      const success = await deleteTaskComment(task.id, deleteCommentId);
      if (success) {
        dispatch({ type: "REMOVE_COMMENT", commentId: deleteCommentId });
        await onSave();
      }
    } finally {
      dispatch({ type: "SET_FIELD", field: "commentSubmitting", value: false });
      dispatch({ type: "SET_FIELD", field: "deleteCommentId", value: null });
    }
  };

  const toggleDependency = (taskId: string): void => {
    dispatch({ type: "TOGGLE_DEPENDENCY", taskId });
  };

  const addCriterion = (): void => {
    dispatch({ type: "ADD_CRITERION" });
  };

  const removeCriterion = (index: number): void => {
    dispatch({ type: "REMOVE_CRITERION", index });
  };

  const addGuardrail = (): void => {
    dispatch({ type: "ADD_GUARDRAIL" });
  };

  const removeGuardrail = (id: string): void => {
    dispatch({ type: "REMOVE_GUARDRAIL", id });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? "Edit Task" : "New Task"}
        boxClassName="!w-[70vw] !max-w-none"
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="task-form">
        <div className="task-form-grid">
          <div className="task-form-section">
            <div className="task-form-group">
              <label className="task-form-label">
                <span>Title *</span>
              </label>
              <Input
                type="text"
                placeholder="Task title"
                value={title}
                onChange={(value) => dispatch({ type: "SET_FIELD", field: "title", value })}
                required
              />
            </div>

            {isEdit && (
              <div className="task-form-group">
                <label className="task-form-label">Status</label>
                <Select
                  options={STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))}
                  value={status}
                  onChange={(value) => dispatch({ type: "SET_FIELD", field: "status", value })}
                />
              </div>
            )}

            {isEdit && (
              <div className="task-form-group">
                <label className="task-form-label">
                  <span>External Blocker</span>
                  {blockedReason !== "" && <span className="task-form-badge-blocked">Blocked</span>}
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Waiting for vendor quote"
                  value={blockedReason}
                  onChange={(value) => dispatch({ type: "SET_FIELD", field: "blockedReason", value })}
                />
                <span className="task-form-helper">
                  Set to block task on external process. Clear to unblock.
                </span>
              </div>
            )}

            <div className="task-form-group">
              <label className="task-form-label">Epic</label>
              <Select
                options={[
                  { value: "", label: "Unassigned" },
                  ...epics.map((epic) => ({ value: epic.id, label: epic.title }))
                ]}
                value={epicId}
                onChange={(value) => dispatch({ type: "SET_FIELD", field: "epicId", value })}
              />
            </div>

            <div className="task-form-group">
              <label className="task-form-label">Priority</label>
              <Select
                options={[
                  { value: "", label: "Default (P1)" },
                  ...PRIORITIES.map((p) => ({
                    value: String(p),
                    label: `${PRIORITY_CONFIG[p].label} - ${p === 0 ? 'Urgent' : p === 1 ? 'Normal' : 'Low'}`
                  }))
                ]}
                value={priority !== undefined ? String(priority) : ""}
                onChange={(val) => dispatch({ type: "SET_FIELD", field: "priority", value: val === "" ? undefined : parseInt(val) as Priority })}
              />
            </div>

            <div className="task-form-group">
              <label className="task-form-label">Type</label>
              <Select
                options={TASK_TYPES.map((t) => ({
                  value: t,
                  label: `${TASK_TYPE_CONFIG[t].symbol} ${TASK_TYPE_CONFIG[t].label}`
                }))}
                value={type}
                onChange={(value) => dispatch({ type: "SET_FIELD", field: "type", value: value as TaskType })}
              />
            </div>

            <div className="task-form-group">
              <label className="task-form-label">
                <span>Dependencies</span>
                {dependsOn.length > 0 && (
                  <Badge variant="gray" size="small">{dependsOn.length} selected</Badge>
                )}
              </label>
              {availableTasks.length === 0 ? (
                <div className="task-form-no-data">No other tasks available</div>
              ) : (
                <div className="task-form-dependencies">
                  {availableTasks.length > 3 && (
                    <div className="task-form-dependencies-filter">
                      <Input
                        type="text"
                        placeholder="Filter tasks..."
                        value={dependencyFilter}
                        onChange={(value) => dispatch({ type: "SET_FIELD", field: "dependencyFilter", value })}
                      />
                    </div>
                  )}
                  <div className="task-form-dependencies-list">
                    {availableTasks
                      .filter(
                        (t) =>
                          dependencyFilter === "" ||
                          t.title
                            .toLowerCase()
                            .includes(dependencyFilter.toLowerCase())
                      )
                      .map((t) => (
                        <label key={t.id} className="task-form-dependency-item">
                          <Checkbox
                            label=""
                            checked={dependsOn.includes(t.id)}
                            onChange={() => toggleDependency(t.id)}
                          />
                          <span className="task-form-dependency-title">{t.title}</span>
                          <span className="task-form-dependency-status">
                            {STATUS_CONFIG[t.status as Status].label}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="task-form-section task-form-section-scrollable">
            {/* Acceptance Criteria */}
            <div className="task-form-group">
              <label className="task-form-label">
                <span>Acceptance Criteria</span>
                {acceptanceCriteria.length > 0 && (
                  <Badge variant="gray" size="small">{acceptanceCriteria.length}</Badge>
                )}
              </label>
              <span className="task-form-helper">
                Observable outcomes to verify task completion
              </span>
              <div className="task-form-list">
                {acceptanceCriteria.map((criterion, index) => (
                  <div key={index} className="task-form-list-item">
                    <span className="task-form-list-item-content">{criterion}</span>
                    <button
                      type="button"
                      className="task-form-list-item-remove"
                      onClick={() => removeCriterion(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="task-form-add-row">
                  <Input
                    type="text"
                    placeholder="Add criterion..."
                    value={newCriterion}
                    onChange={(value) => dispatch({ type: "SET_FIELD", field: "newCriterion", value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCriterion())}
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={addCriterion}
                    disabled={newCriterion.trim() === ""}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Guardrails */}
            <div className="task-form-group">
              <label className="task-form-label">
                <span>Guardrails</span>
                {guardrails.length > 0 && (
                  <Badge variant="gray" size="small">{guardrails.length}</Badge>
                )}
              </label>
              <span className="task-form-helper">
                Numbered constraints (higher number = more critical)
              </span>
              <div className="task-form-list">
                {[...guardrails]
                  .sort((a, b) => b.number - a.number)
                  .map((guardrail) => (
                    <div key={guardrail.id} className="task-form-list-item">
                      <span className="task-form-badge-number">{guardrail.number}</span>
                      <span className="task-form-list-item-content">{guardrail.text}</span>
                      <button
                        type="button"
                        className="task-form-list-item-remove"
                        onClick={() => removeGuardrail(guardrail.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                <div className="task-form-add-row">
                  <Input
                    type="number"
                    placeholder="999"
                    value={newGuardrailNumber}
                    onChange={(value) => dispatch({ type: "SET_FIELD", field: "newGuardrailNumber", value })}
                  />
                  <Input
                    type="text"
                    placeholder="Guardrail instruction..."
                    value={newGuardrailText}
                    onChange={(value) => dispatch({ type: "SET_FIELD", field: "newGuardrailText", value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGuardrail())}
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={addGuardrail}
                    disabled={newGuardrailNumber === "" || parseInt(newGuardrailNumber) <= 0 || newGuardrailText.trim() === ""}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {isEdit && (
              <div className="task-form-group">
                <label className="task-form-label">
                  <span>Comments</span>
                  {comments.length > 0 && (
                    <Badge variant="gray" size="small">{comments.length}</Badge>
                  )}
                </label>
                <div className="task-form-comments">
                  {comments.length > 0 ? (
                    <>
                      {comments.map((comment) => (
                        <div key={comment.id} className="task-form-comment">
                          <div className="task-form-comment-header">
                            <div className="task-form-comment-meta">
                              <span
                                className={`task-form-comment-author ${
                                  comment.author === "mcp"
                                    ? "task-form-comment-author-mcp"
                                    : "task-form-comment-author-user"
                                }`}
                              >
                                {comment.author === "mcp" ? "MCP" : "User"}
                              </span>
                              <span className="task-form-comment-date">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={commentSubmitting}
                            >
                              Delete
                            </Button>
                          </div>
                          <p className="task-form-comment-body">{comment.body}</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="task-form-no-data">No comments yet</div>
                  )}
                  <div className="task-form-add-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentBody}
                      onChange={(value) => dispatch({ type: "SET_FIELD", field: "commentBody", value })}
                      rows={2}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => void handleAddComment()}
                        disabled={commentBody.trim() === "" || commentSubmitting}
                      >
                        {commentSubmitting ? "..." : "Add Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="task-form-footer">
          {isEdit && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={submitting}
              className="task-form-footer-delete"
              style={{ color: '#ef4444' }}
            >
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={title.trim() === "" || submitting}
          >
            {submitting ? "..." : isEdit ? "Save" : "Create"}
          </Button>
        </div>
        </form>
      </Modal>
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Task?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmClassName="btn-error"
        onConfirm={() => void handleDeleteConfirmed()}
        onClose={() => {
          if (!submitting) dispatch({ type: "SET_FIELD", field: "deleteConfirmOpen", value: false });
        }}
        isLoading={submitting}
      />
      <ConfirmModal
        isOpen={deleteCommentId !== null}
        title="Delete Comment?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmClassName="btn-error"
        onConfirm={() => void handleDeleteCommentConfirmed()}
        onClose={() => {
          if (!commentSubmitting) dispatch({ type: "SET_FIELD", field: "deleteCommentId", value: null });
        }}
        isLoading={commentSubmitting}
      />
    </>
  );
}
