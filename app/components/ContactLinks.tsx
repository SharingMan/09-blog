'use client'

import { useState } from 'react'
import './ContactLinks.css'

const EMAIL = 'g5413859@163.com'
const GITHUB_URL = 'https://github.com/SharingMan'
const WECHAT_ID = 'gxh863155964'

const icons = {
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 00-3.64 22.41c.57.11.78-.25.78-.55v-2.05c-3.17.69-3.84-1.53-3.84-1.53a3.03 3.03 0 00-1.27-1.67c-1.04-.71.08-.7.08-.7a2.4 2.4 0 011.75 1.18 2.45 2.45 0 003.35.95 2.44 2.44 0 01.73-1.54c-2.53-.29-5.19-1.27-5.19-5.64A4.42 4.42 0 017.09 7.3a4.1 4.1 0 01.11-3.03s.96-.31 3.15 1.18a10.8 10.8 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18a4.1 4.1 0 01.11 3.03 4.4 4.4 0 011.18 3.05c0 4.39-2.67 5.34-5.21 5.63a2.73 2.73 0 01.78 2.11v3.14c0 .31.21.67.79.55A11.5 11.5 0 0012 .5z" />
    </svg>
  ),
  wechat: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.5 4a6.5 6.5 0 00-6.1 9.04A4.5 4.5 0 014.5 13c.88 0 1.71.2 2.44.54.57.27 1.49-.21 2.12-.58-.04-.26-.06-.53-.06-.8A6.5 6.5 0 0115.21 5.2 6.46 6.46 0 009.5 4zm-2 2a1 1 0 11-.01 2A1 1 0 017.5 6zm4 0a1 1 0 11-.01 2A1 1 0 0111.5 6zm6 3.5a5 5 0 00-5 5c0 2.66 2.34 4.84 5.21 4.96.59.02 1.18-.05 1.75-.19.24-.05.48.11.54.35l.23.89c.09.33.54.43.78.17a6.5 6.5 0 00.99-1.3A5 5 0 0017.5 9.5zm-2 2a1 1 0 11-.01 2A1 1 0 0115.5 11.5zm4 0a1 1 0 11-.01 2A1 1 0 0119.5 11.5z" />
    </svg>
  ),
}

const contacts = [
  {
    id: 'email',
    label: 'Email',
    subtext: EMAIL,
    href: `mailto:${EMAIL}`,
    icon: icons.email,
  },
  {
    id: 'github',
    label: 'GitHub',
    subtext: 'SharingMan',
    href: GITHUB_URL,
    icon: icons.github,
    external: true,
  },
  {
    id: 'wechat',
    label: 'WeChat',
    subtext: WECHAT_ID,
    icon: icons.wechat,
    isCopy: true,
  },
]

interface ContactLinksProps {
  className?: string
  layout?: 'inline' | 'stacked'
}

export default function ContactLinks({ className = '', layout = 'inline' }: ContactLinksProps) {
  const [copied, setCopied] = useState(false)

  const copyWeChatId = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(WECHAT_ID)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = WECHAT_ID
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (error) {
      setCopied(false)
    }
  }

  const groupClass = ['contact-chip-group', `contact-chip-group--${layout}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={groupClass}>
      {contacts.map((item) => {
        const content = (
          <>
            <span className="contact-icon" aria-hidden="true">
              {item.icon}
            </span>
            <div className="contact-text">
              <span>{item.label}</span>
              <span className="contact-subtext">
                {item.id === 'wechat' && copied ? '已复制' : item.subtext}
              </span>
            </div>
          </>
        )

        if (item.isCopy) {
          return (
            <button
              key={item.id}
              type="button"
              className="contact-chip contact-chip-button"
              onClick={copyWeChatId}
              aria-label={`复制 WeChat ID ${WECHAT_ID}`}
            >
              {content}
            </button>
          )
        }

        return (
          <a
            key={item.id}
            href={item.href}
            className="contact-chip"
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            aria-label={`${item.label}: ${item.subtext}`}
          >
            {content}
          </a>
        )
      })}
      <span className="sr-only" aria-live="polite">
        {copied ? 'WeChat ID 已复制到剪贴板' : ''}
      </span>
    </div>
  )
}

