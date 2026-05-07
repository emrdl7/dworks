// @dworks/tree-editor — 트리 기반 편집 operation MVP.
// M2 tree-editor 첫 단위: text/button content edits only.

export {
  applyEditOperation,
  applyEditSequence,
  replaceTextById,
  updateButtonLabel,
  updateText,
} from './operations.js'
export type {
  EditOperation,
  UpdateButtonLabelOperation,
  UpdateTextOperation,
} from './operations.js'
