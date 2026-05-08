// @dworks/tree-editor — 트리 기반 편집 operation MVP.
// M2 tree-editor 첫 단위: text/button content edits only.

export {
  applyEditOperation,
  applyEditSequence,
  deleteNode,
  duplicateNode,
  moveNode,
  replaceTextById,
  updateButtonLabel,
  updateImage,
  updateText,
} from './operations.js'
export type {
  DeleteNodeOperation,
  DuplicateNodeOperation,
  EditOperation,
  MoveNodeOperation,
  UpdateButtonLabelOperation,
  UpdateImageOperation,
  UpdateTextOperation,
} from './operations.js'

// m2-edit-fixtures round 2 합의: schema/type 외부 노출.
export {
  deleteNodeOperationSchema,
  duplicateNodeOperationSchema,
  editOperationSchema,
  editSequenceSchema,
  moveNodeOperationSchema,
  updateButtonLabelOperationSchema,
  updateImageOperationSchema,
  updateTextOperationSchema,
} from './schema.js'
export type { EditSequence } from './schema.js'
