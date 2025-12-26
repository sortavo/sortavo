import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trophy, CheckCircle, XCircle, UserPlus, Users, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  accepted_at: string | null;
  organization: {
    id: string;
    name: string;
  };
  inviter: {
    full_name: string | null;
  };
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Registration form state
  const [showRegistration, setShowRegistration] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token de invitación inválido");
      setIsLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from("team_invitations")
        .select(`
          id,
          email,
          role,
          expires_at,
          accepted_at,
          organization_id
        `)
        .eq("token", token)
        .single();

      if (error || !data) {
        setError("Invitación no encontrada o expirada");
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("Esta invitación ha expirado");
        return;
      }

      // Check if already accepted
      if (data.accepted_at) {
        setError("Esta invitación ya fue aceptada");
        return;
      }

      // Fetch organization details
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", data.organization_id)
        .single();

      setInvitation({
        ...data,
        organization: org || { id: data.organization_id, name: "Organización" },
        inviter: { full_name: null },
      });
    } catch (err) {
      setError("Error al cargar la invitación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAsExistingUser = async () => {
    if (!user || !invitation) return;

    // Check if user email matches invitation
    if (user.email !== invitation.email) {
      toast.error(`Debes iniciar sesión con ${invitation.email} para aceptar esta invitación`);
      return;
    }

    setIsAccepting(true);
    try {
      // Update user's organization
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: invitation.organization.id })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Create role assignment
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{
          user_id: user.id,
          organization_id: invitation.organization.id,
          role: invitation.role as "admin" | "member" | "owner",
        }]);

      if (roleError) throw roleError;

      // Mark invitation as accepted
      await supabase
        .from("team_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      toast.success("¡Te has unido al equipo!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Error al aceptar invitación: " + err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsAccepting(true);
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/invite/${token}`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        toast.info("Revisa tu email para confirmar tu cuenta");
        return;
      }

      // Wait for profile to be created by trigger
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update profile with org and name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          organization_id: invitation.organization.id,
          full_name: fullName,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // Create role assignment
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert([{
          user_id: authData.user.id,
          organization_id: invitation.organization.id,
          role: invitation.role as "admin" | "member" | "owner",
        }]);

      if (roleError) throw roleError;

      // Mark invitation as accepted
      await supabase
        .from("team_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      toast.success("¡Cuenta creada y te has unido al equipo!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Invitación - Sortavo</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 relative overflow-hidden">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10"
          >
            <Card className="w-full max-w-md shadow-xl shadow-violet-500/10 border-violet-100">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-red-100 to-rose-100 mb-4">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-gray-900">Invitación Inválida</h2>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <Button 
                    onClick={() => navigate("/")}
                    className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
                  >
                    Ir al Inicio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  if (!invitation) return null;

  const roleLabel = invitation.role === "admin" ? "Administrador" : "Miembro";

  return (
    <>
      <Helmet>
        <title>Aceptar Invitación - Sortavo</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Sortavo
            </span>
          </Link>

          <Card className="shadow-xl shadow-violet-500/10 border-violet-100 overflow-hidden">
            <CardHeader className="text-center pb-4 bg-gradient-to-br from-violet-50 to-indigo-50/50">
              <div className="flex justify-center mb-4">
                <motion.div 
                  className="p-4 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 relative"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Users className="h-8 w-8 text-violet-600" />
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-500" />
                </motion.div>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ¡Has sido invitado!
              </CardTitle>
              <CardDescription className="text-base mt-2 text-gray-600">
                Te han invitado a unirte a <strong className="text-violet-700">{invitation.organization.name}</strong> como <strong className="text-violet-700">{roleLabel}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {user ? (
                // User is logged in
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 text-center">
                    <p className="text-sm text-gray-600 mb-1">Sesión iniciada como</p>
                    <p className="font-semibold text-gray-900">{user.email}</p>
                  </div>

                  {user.email === invitation.email ? (
                    <Button
                      onClick={handleAcceptAsExistingUser}
                      disabled={isAccepting}
                      className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-300"
                      size="lg"
                    >
                      {isAccepting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Aceptar Invitación
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg border border-red-100">
                        Esta invitación es para <strong>{invitation.email}</strong>. 
                        Inicia sesión con esa cuenta para aceptarla.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          supabase.auth.signOut();
                          navigate(`/auth?redirect=/invite/${token}`);
                        }}
                        className="w-full border-violet-200 hover:bg-violet-50"
                      >
                        Cambiar de Cuenta
                      </Button>
                    </div>
                  )}
                </div>
              ) : showRegistration ? (
                // Registration form
                <form onSubmit={handleRegisterAndAccept} className="space-y-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 text-center">
                    <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre"
                      required
                      className="border-violet-200 focus:border-violet-400 focus:ring-violet-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="border-violet-200 focus:border-violet-400 focus:ring-violet-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      required
                      className="border-violet-200 focus:border-violet-400 focus:ring-violet-400"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isAccepting} 
                    className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-300" 
                    size="lg"
                  >
                    {isAccepting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Crear Cuenta y Unirme
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRegistration(false)}
                    className="w-full text-gray-600 hover:text-violet-600"
                  >
                    Volver
                  </Button>
                </form>
              ) : (
                // Initial options
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 text-center">
                    <p className="text-sm text-gray-600">Invitación para</p>
                    <p className="font-semibold text-gray-900">{invitation.email}</p>
                  </div>

                  <Button
                    onClick={() => setShowRegistration(true)}
                    className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-300"
                    size="lg"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Cuenta Nueva
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-violet-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">
                        o si ya tienes cuenta
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/auth?redirect=/invite/${token}`)}
                    className="w-full border-violet-200 hover:bg-violet-50 hover:border-violet-300"
                  >
                    Iniciar Sesión
                  </Button>
                </div>
              )}

              <p className="text-xs text-center text-gray-500 pt-2">
                Al aceptar, te unes al equipo de {invitation.organization.name} y aceptas nuestros términos de servicio.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
