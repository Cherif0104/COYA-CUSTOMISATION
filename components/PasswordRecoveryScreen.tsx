import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';
import { useLocalization } from '../contexts/LocalizationContext';
import logoSenegel from '../assets/logo_senegel.png';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';

const IMPULCIA_URL = 'https://impulcia-afrique.com/';

export interface PasswordRecoveryScreenProps {
  open: boolean;
  /** Après succès (mot de passe enregistré) — fermer l’overlay ; la session reste valide. */
  onCompleted: () => void;
  /** Abandon : retour connexion (déconnexion locale du jeton recovery). */
  onAbort: () => void | Promise<void>;
}

/**
 * Écran plein écran « nouveau mot de passe » après clic sur le lien Supabase.
 * Aligné visuellement sur {@link Login} (split-screen, glass card, charte SENEGEL).
 */
const PasswordRecoveryScreen: React.FC<PasswordRecoveryScreenProps> = ({ open, onCompleted, onAbort }) => {
  const { t } = useLocalization();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirm('');
    setLocalError('');
    setSuccessMsg('');
    setShowPassword(false);
    setShowConfirm(false);
    setSubmitting(false);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');
    if (password.length < 8) {
      setLocalError(t('signup_error_password_short'));
      return;
    }
    if (password !== confirm) {
      setLocalError(t('passwords_do_not_match'));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setLocalError(error.message || t('login_error_generic'));
        return;
      }
      setSuccessMsg(t('recovery_success'));
      window.setTimeout(() => {
        onCompleted();
      }, 1600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('login_error_generic');
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbort = async () => {
    await onAbort();
  };

  return (
    <div className="fixed inset-0 z-[100] font-coya overflow-hidden bg-[#071018]">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 800px at 20% 20%, rgba(13,122,43,0.25), transparent 60%), radial-gradient(900px 700px at 80% 60%, rgba(25,156,69,0.18), transparent 60%), linear-gradient(180deg, #071018 0%, #0F172A 55%, #071018 100%)',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.50) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      <div className="relative h-full w-full flex items-stretch">
        <div className="hidden lg:flex lg:w-[52%] xl:w-[58%] relative overflow-hidden">
          <div className="absolute inset-0" aria-hidden>
            <div
              className="absolute -top-28 -left-24 h-96 w-96 rounded-full blur-3xl animate-loading-shape"
              style={{ background: 'rgba(13,122,43,0.26)' }}
            />
            <div
              className="absolute -bottom-36 right-0 h-[28rem] w-[28rem] rounded-full blur-3xl animate-loading-shape"
              style={{ background: 'rgba(244,196,48,0.14)', animationDelay: '-2.5s' }}
            />
          </div>
          <div className="relative z-10 p-12 xl:p-14 flex flex-col justify-between w-full">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center">
                  <img src={logoSenegel} alt="SENEGEL" className="h-10 w-10 object-contain" />
                </div>
                <div>
                  <p className="text-white text-lg font-semibold tracking-tight">COYA ERP</p>
                  <p className="text-white/65 text-sm">Plateforme institutionnelle — SENEGEL</p>
                </div>
              </div>
              <div className="max-w-xl">
                <p className="text-white text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">
                  Citoyenneté. Transparence. Compétences.
                </p>
                <p className="text-white/70 text-sm xl:text-base mt-3 leading-relaxed">
                  {t('recovery_subtitle')}
                </p>
              </div>
            </div>
            <div className="text-white/55 text-xs">© SENEGEL • {new Date().getFullYear()}</div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-[420px]">
            <Card className="border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.30)]">
              <CardContent className="p-6 sm:p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center lg:hidden">
                    <img src={logoSenegel} alt="SENEGEL" className="h-8 w-8 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-lg font-semibold leading-tight">{t('recovery_title')}</p>
                    <p className="text-white/65 text-sm">{t('recovery_card_hint')}</p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {localError ? (
                    <div className="bg-red-500/15 border border-red-500/25 text-red-50 px-4 py-3 rounded-xl text-sm">{localError}</div>
                  ) : null}
                  {successMsg ? (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-50 px-4 py-3 rounded-xl text-sm">
                      {successMsg}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <label htmlFor="recovery-password" className="block text-sm font-medium text-white/85">
                      {t('password')}
                    </label>
                    <Input
                      id="recovery-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/90 border-white/15 focus:border-white/30 focus:ring-white/10"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={!!successMsg}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="text-gray-500 hover:text-gray-700"
                          aria-label={showPassword ? t('signup_hide_password') : t('signup_show_password')}
                        >
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                        </button>
                      }
                    />
                    <p className="text-[11px] text-white/55">{t('signup_password_min_length')}</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="recovery-confirm" className="block text-sm font-medium text-white/85">
                      {t('confirm_password')}
                    </label>
                    <Input
                      id="recovery-confirm"
                      name="confirm-new-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="bg-white/90 border-white/15 focus:border-white/30 focus:ring-white/10"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={!!successMsg}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="text-gray-500 hover:text-gray-700"
                          aria-label={showConfirm ? t('signup_hide_confirm_password') : t('signup_show_confirm_password')}
                        >
                          <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                        </button>
                      }
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <Button type="submit" className="w-full" disabled={submitting || !!successMsg}>
                      {submitting ? t('recovery_submitting') : t('recovery_submit')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/15"
                      disabled={submitting}
                      onClick={() => void handleAbort()}
                    >
                      {t('recovery_back_login')}
                    </Button>
                    <p className="text-center text-[11px] text-white/60 flex items-center justify-center gap-1">
                      <i className="fa fa-lock" aria-hidden />
                      {t('recovery_secure_notice')}
                    </p>
                  </div>

                  <p className="text-center text-xs text-white/55 pt-2 border-t border-white/10">
                    Solution développée par{' '}
                    <a
                      href={IMPULCIA_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/75 hover:text-white underline-offset-4 hover:underline"
                    >
                      Impulcia Afrique
                    </a>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryScreen;
