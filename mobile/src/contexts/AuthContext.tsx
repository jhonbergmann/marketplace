import {createContext, ReactNode, useState, useEffect} from 'react'

import {UserDTO} from '@dtos/UserDTO'
import {storageUserGet, storageUserRemove, storageUserSave} from '@storage/storageUser'
import {storageAuthTokenSave, storageAuthTokenGet, storageAuthTokenRemove} from '@storage/storageAuthToken'
import {api} from '@services/api'

export type AuthContextDataProps = {
  user: UserDTO
  singIn: (email: string, password: string) => Promise<void>
  token: string
  signOut: () => Promise<void>
}

type AuthContextProviderProps = {
  children: ReactNode
}

export const AuthContext = createContext<AuthContextDataProps>({} as AuthContextDataProps)

export const AuthContextProvider = ({children}: AuthContextProviderProps) => {
  const [user, setUser] = useState<UserDTO>({} as UserDTO)
  const [token, _] = useState<string>('')

  const storageUserAndTokenSave = async (userData: UserDTO, token: string) => {
    try {
      await storageUserSave(userData)
      await storageAuthTokenSave(token)
    } catch (error) {
      throw error
    }
  }

  const userAndTokenUpdate = (userData: UserDTO, token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    setUser(userData)
  }

  const loadUserData = async () => {
    try {
      const userLogged = await storageUserGet()
      const token = await storageAuthTokenGet()

      if (token && userLogged) {
        userAndTokenUpdate(userLogged, token)
      }
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    try {
      setUser({} as UserDTO)
      await storageUserRemove()
      await storageAuthTokenRemove()
    } catch (error) {
      throw error
    }
  }

  const singIn = async (email: string, password: string) => {
    try {
      const {data} = await api.post('/sessions', {email, password})

      if (data.user && data.token) {
        await storageUserAndTokenSave(data.user, data.token)
        userAndTokenUpdate(data.user, data.token)
      }
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    loadUserData()
  }, [])

  return <AuthContext.Provider value={{user, singIn, token, signOut}}>{children}</AuthContext.Provider>
}
