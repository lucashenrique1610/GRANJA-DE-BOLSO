"use client"

import { useState, useEffect, useCallback } from "react"

type SetValue<T> = T | ((val: T) => T)

function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize with initialValue to match server-side rendering
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // After mounting, read from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      setStoredValue((current) => {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(current) : value
        
        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
        
        return valueToStore
      })
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key])

  return [storedValue, setValue] as const
}

export default useLocalStorage
