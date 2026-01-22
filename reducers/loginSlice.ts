import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Select } from '../interfaces/interfaces';

interface LoginState {
  isLoggedIn: boolean;
  user: string;
  username: string;
  userrol: string;
  rolesVisita: Select[];
  rolesRegistro: Select[];
  unidades: Select[];
}

const initialState: LoginState = {
  isLoggedIn: false,
  user: '',
  username: '',
  userrol: '',
  rolesVisita: [],
  rolesRegistro: [],
  unidades: []
}

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: string; username: string; userrol: string; rolesAnidados: Select[]; unidades: Select[] }>) => {
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.username = action.payload.username;
      state.userrol = action.payload.userrol;
      state.rolesRegistro = action.payload.rolesAnidados.filter(item => item.tipo && item.tipo !== "V");
      state.rolesVisita = action.payload.rolesAnidados;
      state.unidades = action.payload.unidades;
    },
    loginFailure: () => initialState,
    logout: () => initialState,
  },
});

export const { loginSuccess, loginFailure, logout } = loginSlice.actions;
export default loginSlice.reducer;
