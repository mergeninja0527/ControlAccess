import { Redirect, Route, RouteProps } from 'react-router';
import { useAppSelector } from './hooks/loginHooks';

// Map role IDs to role codes (consistent with backend mapping)
const ROLE_ID_TO_CODE: Record<string, string> = {
  '1': 'ADM',  // Administrador (also used for SAD)
  '2': 'SUP',  // Supervisor (also used for OFC, ENC)
  '3': 'USR',  // Usuario (also used for PRO, RES)
  '4': 'VIS',  // Visitante
};

// Map role codes to role IDs (reverse mapping)
const ROLE_CODE_TO_ID: Record<string, number> = {
  'SAD': 1,  // Super Admin -> Administrador
  'ADM': 1,  // Administrador
  'SUP': 2,  // Supervisor
  'OFC': 2,  // Oficial -> Supervisor
  'ENC': 2,  // Encargado -> Supervisor
  'USR': 3,  // Usuario
  'PRO': 3,  // Proveedor -> Usuario
  'RES': 3,  // Residente -> Usuario
  'VIS': 4,  // Visitante
};

interface ProtectedRoleRouteProps extends RouteProps {
  roles: string[];
}

export const ProtectedRoleRoute: React.FC<ProtectedRoleRouteProps> = ({ component: Component, roles, ...rest }) => {
  const { isLoggedIn, userrol } = useAppSelector((state) => state.login);

  // Convert userrol to role code if it's a number/ID
  const getRoleCode = (role: string | number): string => {
    const roleStr = String(role);
    
    // If it's already a role code (string), check if it's valid
    if (ROLE_CODE_TO_ID[roleStr]) {
      return roleStr;
    }
    
    // If it's a role ID (number), convert to code
    return ROLE_ID_TO_CODE[roleStr] || roleStr;
  };

  const userRoleCode = getRoleCode(userrol);
  
  console.log('[ProtectedRoute] isLoggedIn:', isLoggedIn);
  console.log('[ProtectedRoute] userrol (raw):', userrol);
  console.log('[ProtectedRoute] userRoleCode:', userRoleCode);
  console.log('[ProtectedRoute] allowed roles:', roles);
  console.log('[ProtectedRoute] has access:', roles.includes(userRoleCode));

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isLoggedIn) {
          console.log('[ProtectedRoute] Not logged in, redirecting to login');
          return <Redirect to={`/login`} />;
        }
        
        // Check if user's role is in the allowed roles
        // Check both the role code and the raw role value
        const hasAccess = roles.includes(userRoleCode) || roles.includes(String(userrol));
        
        if (!hasAccess) {
          console.log('[ProtectedRoute] No access, redirecting to home');
          // If trying to access home without permission, just allow it for logged in users
          if (rest.path === '/home') {
            return Component ? <Component {...props} /> : null;
          }
          return <Redirect to="/home" />;
        }
        
        return Component ? <Component {...props} /> : null;
      }}
    />
  );
}

// Export helper function to check if user has a specific role
export const hasRole = (userrol: string | number, allowedRoles: string[]): boolean => {
  const getRoleCode = (role: string | number): string => {
    const roleStr = String(role);
    if (ROLE_CODE_TO_ID[roleStr]) {
      return roleStr;
    }
    return ROLE_ID_TO_CODE[roleStr] || roleStr;
  };
  
  const userRoleCode = getRoleCode(userrol);
  return allowedRoles.includes(userRoleCode) || allowedRoles.includes(String(userrol));
};