
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { PwaInstallPrompt } from './pwa-install-prompt'

describe('PwaInstallPrompt', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    // Mock localStorage
    const localStorageMock = (function() {
      let store: any = {}
      return {
        getItem: function(key: string) {
          return store[key] || null
        },
        setItem: function(key: string, value: string) {
          store[key] = value.toString()
        },
        clear: function() {
          store = {}
        },
        removeItem: function(key: string) {
          delete store[key]
        }
      }
    })()
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })

    // Mock navigator.userAgent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      writable: true
    })
  })

  it('does not render initially', () => {
    const { container } = render(<PwaInstallPrompt />)
    expect(container.firstChild).toBeNull()
  })

  it('renders when beforeinstallprompt event is fired', async () => {
    render(<PwaInstallPrompt />)

    // Create event
    const event = new Event('beforeinstallprompt') as any
    event.prompt = vi.fn()
    event.userChoice = Promise.resolve({ outcome: 'accepted' })
    
    // Dispatch event
    fireEvent(window, event)

    // Should appear (might need to wait for state update if async, but it's synchronous in useEffect usually)
    // Actually, react state updates are async. 
    // Also, the component checks localStorage "pwa-prompt-dismissed". It's empty in mock.
    
    // We need to wait for the element to appear
    const button = await screen.findByText('Adicionar à Tela Inicial')
    expect(button).toBeInTheDocument()
  })

  it('does not render if dismissed previously', () => {
    localStorage.setItem('pwa-prompt-dismissed', 'true')
    render(<PwaInstallPrompt />)
    
    const event = new Event('beforeinstallprompt')
    fireEvent(window, event)
    
    const button = screen.queryByText('Adicionar à Tela Inicial')
    expect(button).not.toBeInTheDocument()
  })
})
