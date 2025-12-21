"use client"

import { useState } from "react"

type SetValue<T> = T | ((val: T) => T)

function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      // Obter do localStorage
      const item = window.localStorage.getItem(key)
      // Analisar JSON armazenado ou retornar initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Função para atualizar o valor no localStorage
  const setValue = (value: SetValue<T>) => {
    try {
      // Permitir que o valor seja uma função para seguir o mesmo padrão do useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Salvar estado
      setStoredValue(valueToStore)

      // Salvar no localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}

export default useLocalStorage
