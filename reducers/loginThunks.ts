import { AppDispatch } from './store';
import { loginSuccess, logout } from './loginSlice';
import { Select } from '../interfaces/interfaces';

export const handleLoginSuccess = (user: string, username: string, userrol: string, rolesAnidados: Select[], unidades: Select[]) => (dispatch: AppDispatch) => {
  dispatch(loginSuccess({ user, username, userrol, rolesAnidados, unidades }));
};

export const handleLogout = () => (dispatch: AppDispatch) => {
  dispatch(logout());
}