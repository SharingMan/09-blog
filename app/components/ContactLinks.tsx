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
    <svg viewBox="0 0 1024 1024" fill="currentColor">
      <path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.67281 1.795902-26.647917-122.810047-159.358451-214.077703-310.826188-214.077703-169.353083 0-308.085774 114.232694-308.085774 259.274068 0 83.708494 46.165436 152.460344 123.281791 205.78483l-30.80868 91.730191 107.688651-53.455469c38.558178 7.53665 69.459978 15.308661 107.924012 15.308661 9.66308 0 19.230993-0.470721 28.752858-1.225921-6.025227-20.36584-9.521864-41.723264-9.521864-63.862493C402.328693 476.632491 517.908058 368.541681 664.250054 368.541681zM498.62897 285.87389c23.200398 0 38.557154 15.120372 38.557154 38.061874 0 22.846334-15.356756 38.156018-38.557154 38.156018-23.107277 0-46.260603-15.309684-46.260603-38.156018C452.368366 300.994262 475.522716 285.87389 498.62897 285.87389zM283.016307 362.090758c-23.107277 0-46.402843-15.309684-46.402843-38.156018 0-22.941502 23.295566-38.061874 46.402843-38.061874 23.081695 0 38.46301 15.120372 38.46301 38.061874C321.479317 346.782098 306.098002 362.090758 283.016307 362.090758zM945.448458 606.151333c0-121.888048-123.258255-221.236753-261.683954-221.236753-146.57838 0-262.015505 99.348706-262.015505 221.236753 0 122.06508 115.437126 221.200938 262.015505 221.200938 30.66644 0 61.617359-7.609305 92.423993-15.262612l84.513836 45.786813-23.178909-76.17082C899.379213 735.776599 945.448458 674.90216 945.448458 606.151333zM598.803483 567.994292c-15.332197 0-30.807656-15.096836-30.807656-30.501688 0-15.190981 15.47546-30.477129 30.807656-30.477129 23.295566 0 38.558178 15.286148 38.558178 30.477129C637.361661 552.897456 622.099049 567.994292 598.803483 567.994292zM768.25071 567.994292c-15.213493 0-30.594809-15.096836-30.594809-30.501688 0-15.190981 15.381315-30.477129 30.594809-30.477129 23.107277 0 38.558178 15.286148 38.558178 30.477129C806.808888 552.897456 791.357987 567.994292 768.25071 567.994292z"/>
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

