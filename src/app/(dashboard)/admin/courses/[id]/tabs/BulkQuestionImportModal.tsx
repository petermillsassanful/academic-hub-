'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { EditableQuestion } from './QuizFormModal'

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (importedQuestions: EditableQuestion[]) => void
}

export function BulkQuestionImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [rawText, setRawText] = useState('')
  const [parsedPreview, setParsedPreview] = useState<EditableQuestion[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  // Smart parser for standard questions (Aiken, standard numbered exam format, CSV, etc.)
  function parseQuestionsText(text: string): EditableQuestion[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
    const result: EditableQuestion[] = []

    let currentQText = ''
    let currentOptions: string[] = []
    let currentAnswer = ''
    let isTF = false

    function flushCurrent() {
      if (currentQText && (currentOptions.length >= 2 || isTF)) {
        let finalOptions = currentOptions
        let finalAnswer = currentAnswer

        if (isTF) {
          finalOptions = ['True', 'False']
          if (!finalAnswer) finalAnswer = 'True'
        } else {
          // If no answer was marked with "Answer: X", check if any option had an asterisk (*)
          if (!finalAnswer && currentOptions.length > 0) {
            const starOpt = currentOptions.find((o) => o.includes('*'))
            if (starOpt) {
              finalAnswer = starOpt.replace(/\*/g, '').trim()
            } else {
              finalAnswer = currentOptions[0] // fallback to first option
            }
          }
        }

        // Clean options from asterisks
        finalOptions = finalOptions.map((o) => o.replace(/\*/g, '').trim())

        result.push({
          question_text: currentQText,
          question_type: isTF ? 'true_false' : 'multiple_choice',
          points: 1,
          options: finalOptions,
          correct_answer: finalAnswer.replace(/\*/g, '').trim(),
        })
      }

      currentQText = ''
      currentOptions = []
      currentAnswer = ''
      isTF = false
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for Question start: e.g. "1. What is...", "Q1: What is...", "1) What is..."
      const qMatch = line.match(/^(?:Q\d+[:.]|\d+[\).])\s*(.+)/i)
      // Check for Answer line: e.g. "Answer: B", "Ans: A", "ANSWER: True"
      const ansMatch = line.match(/^(?:ANSWER|ANS|CORRECT):\s*([A-Za-z0-9\s]+)/i)
      // Check for Option start: e.g. "A) option", "A. option", "[A] option", "(A) option"
      const optMatch = line.match(/^(?:[A-Da-d][\).\]]|\([A-Da-d]\))\s*(.+)/)

      if (qMatch) {
        flushCurrent()
        currentQText = qMatch[1].trim()
      } else if (ansMatch) {
        const rawAns = ansMatch[1].trim()
        if (rawAns.toLowerCase() === 'true' || rawAns.toLowerCase() === 'false') {
          isTF = true
          currentAnswer = rawAns.charAt(0).toUpperCase() + rawAns.slice(1).toLowerCase()
        } else if (/^[A-Da-d]$/.test(rawAns)) {
          // It's a letter like A, B, C, D — map to corresponding option if available
          const letterIdx = rawAns.toUpperCase().charCodeAt(0) - 65
          if (currentOptions[letterIdx]) {
            currentAnswer = currentOptions[letterIdx]
          } else {
            currentAnswer = rawAns.toUpperCase()
          }
        } else {
          currentAnswer = rawAns
        }
      } else if (optMatch) {
        const optText = optMatch[1].trim()
        currentOptions.push(optText)
      } else if (!currentQText && !optMatch && !ansMatch) {
        // Line without numbering could be a question if it ends with ? or looks like a prompt
        if (line.endsWith('?') || lines[i + 1]?.match(/^[A-Da-d][\).]/)) {
          flushCurrent()
          currentQText = line
        }
      }
    }

    flushCurrent()
    return result
  }

  function handleTextChange(val: string) {
    setRawText(val)
    setParseError(null)
    if (!val.trim()) {
      setParsedPreview([])
      return
    }

    const parsed = parseQuestionsText(val)
    setParsedPreview(parsed)
    if (parsed.length === 0) {
      setParseError('Could not recognize question format. Please check the sample format below.')
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        handleTextChange(content)
      }
    }
    reader.readAsText(file)
  }

  function loadSample() {
    const sample = `1. Which data structure operates on a Last-In, First-Out (LIFO) principle?
A) Queue
B) Stack
C) Linked List
D) Binary Tree
Answer: B

2. What is the time complexity of binary search in a sorted array of size N?
A) O(N)
B) O(1)
C) O(log N)
D) O(N^2)
Answer: C

3. In object-oriented programming, encapsulation is the mechanism of bundling data and methods.
Answer: True

4. Which protocol is used to securely transfer web pages over the internet?
A) HTTP
B) FTP
C) HTTPS
D) SMTP
Answer: C

5. An SQL primary key can contain NULL values.
Answer: False`

    handleTextChange(sample)
  }

  function handleConfirmImport() {
    if (parsedPreview.length === 0) return
    onImport(parsedPreview)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Questions (Docs / Text / AI)"
      maxWidth={680}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
          Quickly upload or paste 50–100+ questions from your lecture files, word processors, or past question banks.
        </p>

        {/* Upload Button + Sample Loader */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{
            padding: '8px 16px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            color: '#1D4ED8',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Choose Document / File (.txt, .csv)
            <input type="file" accept=".txt,.csv,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            onClick={loadSample}
            style={{
              padding: '8px 14px',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            📋 Paste Sample Format
          </button>
        </div>

        {/* Text Area */}
        <div>
          <textarea
            value={rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`Paste 50, 100, or more questions here...\n\nExample:\n1. Which keyword defines a class in Java?\nA) function\nB) class\nC) define\nD) struct\nAnswer: B`}
            rows={10}
            style={{
              width: '100%',
              padding: '12px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#0F172A',
              fontSize: '13px',
              fontFamily: 'monospace',
              lineHeight: 1.6,
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Extraction status bar */}
        {parsedPreview.length > 0 && (
          <div style={{
            padding: '12px 16px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            color: '#065F46',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>
              🎉 <strong>Successfully extracted {parsedPreview.length} questions</strong> from your document!
            </span>
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
              Ready to import into Question Bank
            </span>
          </div>
        )}

        {parseError && (
          <div style={{
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '13px',
          }}>
            {parseError}
          </div>
        )}

        {/* Format hint */}
        <div style={{
          padding: '12px 14px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#475569',
          lineHeight: 1.6,
        }}>
          💡 <strong>Supported Formats:</strong> Numbered questions (<code>1.</code> or <code>Q1:</code>), options labeled <code>A)</code>, <code>B)</code>, <code>C)</code>, <code>D)</code>, with answers indicated by <code>Answer: B</code> or with an asterisk <code>*</code> (e.g. <code>B) option*</code>). True/False is also supported with <code>Answer: True</code>.
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              color: '#64748B',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedPreview.length === 0}
            className="btn-primary"
            style={{
              padding: '9px 22px',
              fontSize: '14px',
            }}
          >
            Import {parsedPreview.length > 0 ? `${parsedPreview.length} Questions` : 'Questions'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
