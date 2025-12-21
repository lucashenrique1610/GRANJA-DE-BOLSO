import React from "react"
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import LoginPage from "@/app/page"
import { Toaster } from "@/components/ui/toaster"

vi.mock("@/hooks/use-auth", () => {
  return {
    useAuth: () => ({
      login: async (email: string, password: string) => ({ ok: false, unconfirmed: true }),
      register: async (nome: string, email: string, password: string) => true,
      sendPasswordReset: async () => true,
      completePasswordReset: async () => true,
      needsPasswordReset: false,
      resendEmailConfirmation: vi.fn(async () => true),
    }),
  }
})

vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  }
})

describe("Auth feedback messages", () => {
  it("shows success toast after registration", async () => {
    render(
      <>
        <LoginPage />
        <Toaster />
      </>,
    )

    const cadastroTab = screen.getByText("Cadastro")
    fireEvent.pointerDown(cadastroTab)
    fireEvent.click(cadastroTab)

    const cadastrarBtn = await screen.findByText("Cadastrar")
    const form = cadastrarBtn.closest("form") as HTMLFormElement
    const formUtils = within(form)

    fireEvent.change(formUtils.getByLabelText("Nome"), { target: { value: "User" } })
    fireEvent.change(formUtils.getByLabelText("Email"), { target: { value: "user@example.com" } })
    fireEvent.change(formUtils.getByLabelText("Senha"), { target: { value: "password" } })
    fireEvent.submit(form)

    expect(await screen.findByText(/Cadastro realizado com sucesso/i)).toBeInTheDocument()
  })

  it("shows unconfirmed account toast on login and exposes resend action", async () => {
    render(
      <>
        <LoginPage />
        <Toaster />
      </>,
    )

    const form = screen.getByText("Entrar").closest("form") as HTMLFormElement
    const formUtils = within(form)

    fireEvent.change(formUtils.getByLabelText("Email"), { target: { value: "user@example.com" } })
    fireEvent.change(formUtils.getByLabelText("Senha"), { target: { value: "password" } })
    fireEvent.submit(form)

    expect(await screen.findByText(/Conta não verificada/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Reenviar e-mail de confirmação/i })).toBeInTheDocument()
  })
})
