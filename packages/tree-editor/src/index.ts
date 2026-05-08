// @dworks/tree-editor — 트리 기반 편집 operation MVP.
// M2 tree-editor 첫 단위: text/button content edits only.

export {
  applyEditOperation,
  applyEditSequence,
  deleteNode,
  duplicateNode,
  moveNode,
  replaceTextById,
  updateColor,
  updateLayout,
  updateShape,
  updateSpacing,
  updateButtonLabel,
  updateImage,
  updateStyleTokens,
  updateText,
  updateTextTypography,
} from './operations.js'
export type {
  DeleteNodeOperation,
  DuplicateNodeOperation,
  EditOperation,
  MoveNodeOperation,
  UpdateButtonLabelOperation,
  UpdateColorOperation,
  UpdateImageOperation,
  UpdateLayoutOperation,
  UpdateShapeOperation,
  UpdateSpacingOperation,
  UpdateStyleTokensOperation,
  UpdateTextOperation,
  UpdateTextTypographyOperation,
} from './operations.js'

// m2-edit-fixtures round 2 합의: schema/type 외부 노출.
export {
  deleteNodeOperationSchema,
  duplicateNodeOperationSchema,
  editOperationSchema,
  editSequenceSchema,
  moveNodeOperationSchema,
  updateButtonLabelOperationSchema,
  updateColorOperationSchema,
  updateImageOperationSchema,
  updateLayoutOperationSchema,
  updateShapeOperationSchema,
  updateSpacingOperationSchema,
  updateStyleTokensOperationSchema,
  updateTextOperationSchema,
  updateTextTypographyOperationSchema,
} from './schema.js'
export type { EditSequence } from './schema.js'
