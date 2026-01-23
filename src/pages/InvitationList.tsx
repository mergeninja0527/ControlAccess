import {
  IonContent,
  IonIcon,
  IonPage,
  IonLoading,
  IonRefresher,
  IonRefresherContent,
  useIonRouter,
  useIonToast,
  IonModal,
  IonButton,
  RefresherEventDetail
} from '@ionic/react';
import { useEffect, useState, useRef } from 'react';
import { arrowBack, closeCircle, checkmarkCircle, timeOutline, banOutline, qrCodeOutline } from 'ionicons/icons';
import { useAppSelector } from '../../hooks/loginHooks';
import httpClient from '../../hooks/CapacitorClient';
import '../../assets/InvitationList.css';

interface Invitation {
  id: number;
  idAcceso: string;
  nombreInvitado: string;
  rutInvitado: string;
  correoInvitado: string;
  telefonoInvitado: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  idSala: number;
  sala: string;
  status: string;
  usageLimit: number;
  usedCount: number;
  qrCode: string;
  fechaCreacion: string;
  cancelledAt: string | null;
}

const InvitationList: React.FC = () => {
  const router = useIonRouter();
  const { user } = useAppSelector((state) => state.login);
  const [loading, setLoading] = useState<boolean>(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [toast] = useIonToast();

  const showToast = (message: string, color: 'warning' | 'danger' | 'success' = "success") => {
    toast({
      message,
      duration: 2000,
      swipeGesture: "vertical",
      position: "top",
      color,
      buttons: [{ text: "✖", role: "cancel" }]
    });
  };

  const handleBack = () => {
    router.push('/home', 'back', 'pop');
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const normalizedUser = user?.replace(/\./g, '') || '';
      console.log('[InvitationList] Fetching for user:', normalizedUser);
      
      const response = await httpClient.get(`/invitations?userId=${normalizedUser}`);
      
      console.log('[InvitationList] Response:', response);
      
      if (response.data?.success) {
        setInvitations(response.data.data || []);
      } else {
        showToast('Error al cargar invitaciones', 'danger');
      }
    } catch (error) {
      console.error('[InvitationList] Error:', error);
      showToast('Error al cargar invitaciones', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchInvitations();
    event.detail.complete();
  };

  const handleCancelInvitation = async (invitation: Invitation) => {
    try {
      setLoading(true);
      const normalizedUser = user?.replace(/\./g, '') || '';
      
      const response = await httpClient.post(`/invitations/${invitation.id}/cancel`, {
        cancelledBy: normalizedUser
      });

      if (response.data?.success) {
        showToast('Invitación cancelada exitosamente', 'success');
        fetchInvitations(); // Refresh list
      } else {
        showToast(response.data?.message || 'Error al cancelar', 'danger');
      }
    } catch (error) {
      console.error('[InvitationList] Cancel error:', error);
      showToast('Error al cancelar invitación', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setShowQRModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'PENDING':
        return 'status-pending';
      case 'EXPIRED':
        return 'status-expired';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'USED':
        return 'status-used';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'PENDING':
        return 'Pendiente';
      case 'EXPIRED':
        return 'Expirada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'USED':
        return 'Usada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return checkmarkCircle;
      case 'PENDING':
        return timeOutline;
      case 'EXPIRED':
        return timeOutline;
      case 'CANCELLED':
        return banOutline;
      case 'USED':
        return checkmarkCircle;
      default:
        return timeOutline;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen className="invitation-list-content">
        <IonLoading spinner="circles" isOpen={loading} onDidDismiss={() => setLoading(false)} />
        
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="invitation-list-container">
          {/* Header */}
          <div className="invitation-list-header">
            <button className="invitation-back-button" onClick={handleBack}>
              <IonIcon icon={arrowBack} />
              <span>Volver</span>
            </button>
          </div>

          {/* Title */}
          <h1 className="invitation-list-title">Mis Invitaciones</h1>
          <p className="invitation-list-subtitle">Gestiona tus invitaciones de acceso</p>

          {/* List */}
          <div className="invitation-list">
            {invitations.length === 0 ? (
              <div className="invitation-empty">
                <p>No tienes invitaciones creadas</p>
                <IonButton onClick={() => router.push('/visit', 'forward', 'push')}>
                  Crear Invitación
                </IonButton>
              </div>
            ) : (
              invitations.map((invitation) => (
                <div key={invitation.id} className="invitation-card">
                  <div className="invitation-card-header">
                    <div className="invitation-name">{invitation.nombreInvitado}</div>
                    <div className={`invitation-status ${getStatusColor(invitation.status)}`}>
                      <IonIcon icon={getStatusIcon(invitation.status)} />
                      <span>{getStatusLabel(invitation.status)}</span>
                    </div>
                  </div>
                  
                  <div className="invitation-card-body">
                    {invitation.rutInvitado && (
                      <div className="invitation-detail">
                        <span className="label">RUT:</span>
                        <span className="value">{invitation.rutInvitado}</span>
                      </div>
                    )}
                    <div className="invitation-detail">
                      <span className="label">Válido:</span>
                      <span className="value">
                        {formatDate(invitation.fechaInicio)} - {formatDate(invitation.fechaFin)}
                      </span>
                    </div>
                    {invitation.sala && (
                      <div className="invitation-detail">
                        <span className="label">Ubicación:</span>
                        <span className="value">{invitation.sala}</span>
                      </div>
                    )}
                    {invitation.motivo && (
                      <div className="invitation-detail">
                        <span className="label">Motivo:</span>
                        <span className="value">{invitation.motivo}</span>
                      </div>
                    )}
                    <div className="invitation-detail">
                      <span className="label">Usos:</span>
                      <span className="value">{invitation.usedCount} / {invitation.usageLimit}</span>
                    </div>
                  </div>

                  <div className="invitation-card-actions">
                    {invitation.status === 'ACTIVE' && (
                      <>
                        <button 
                          className="invitation-action-btn qr-btn"
                          onClick={() => handleShowQR(invitation)}
                        >
                          <IonIcon icon={qrCodeOutline} />
                          Ver QR
                        </button>
                        <button 
                          className="invitation-action-btn cancel-btn"
                          onClick={() => handleCancelInvitation(invitation)}
                        >
                          <IonIcon icon={closeCircle} />
                          Cancelar
                        </button>
                      </>
                    )}
                    {invitation.status === 'PENDING' && (
                      <>
                        <button 
                          className="invitation-action-btn qr-btn"
                          onClick={() => handleShowQR(invitation)}
                        >
                          <IonIcon icon={qrCodeOutline} />
                          Ver QR
                        </button>
                        <button 
                          className="invitation-action-btn cancel-btn"
                          onClick={() => handleCancelInvitation(invitation)}
                        >
                          <IonIcon icon={closeCircle} />
                          Cancelar
                        </button>
                      </>
                    )}
                    {(invitation.status === 'EXPIRED' || invitation.status === 'CANCELLED' || invitation.status === 'USED') && (
                      <button 
                        className="invitation-action-btn qr-btn disabled"
                        disabled
                      >
                        <IonIcon icon={qrCodeOutline} />
                        QR No Disponible
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QR Modal */}
        <IonModal isOpen={showQRModal} onDidDismiss={() => setShowQRModal(false)}>
          <div className="qr-modal-content">
            <div className="qr-modal-header">
              <h2>Código QR</h2>
              <button onClick={() => setShowQRModal(false)}>
                <IonIcon icon={closeCircle} />
              </button>
            </div>
            {selectedInvitation && (
              <div className="qr-modal-body">
                <div className="qr-image-container">
                  <img 
                    src={selectedInvitation.qrCode} 
                    alt="QR Code" 
                  />
                </div>
                <p className="qr-name">{selectedInvitation.nombreInvitado}</p>
                <p className="qr-validity">
                  Válido hasta: {formatDate(selectedInvitation.fechaFin)}
                </p>
              </div>
            )}
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default InvitationList;
