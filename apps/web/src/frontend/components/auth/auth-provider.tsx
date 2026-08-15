import type { DeepPartial, Localization } from "@better-auth-ui/core";
import { deepmerge } from "@better-auth-ui/core";
import {
    type AuthPlugin,
    AuthProvider as AuthProviderPrimitive,
    type AuthProviderProps,
} from "@better-auth-ui/react";
import type {
    ComponentPropsWithoutRef,
    ComponentType,
    PropsWithChildren,
    ReactNode,
} from "react";

import { ErrorToaster } from "./error-toaster";

declare module "@better-auth-ui/core" {
    interface AuthConfig {
        /**
         * React component used to render internal navigation links.
         * Typically TanStack Router's `Link` or Next.js's `Link`.
         */
        Link: ComponentType<
            PropsWithChildren<
                { className?: string; href: string; to?: string } & Pick<
                    ComponentPropsWithoutRef<"a">,
                    "aria-disabled" | "tabIndex" | "onClick"
                >
            >
        >;
    }

    /** Widen `AdditionalField.label` to `ReactNode` in the shadcn package. */
    interface AdditionalFieldRegister {
        label: ReactNode;
    }

    /** Register React-specific AuthPlugin fields (views, fallbackViews, components). */
    interface AuthPluginRegister {
        react: AuthPlugin;
    }
}

/**
 * Spanish (CO) copy for the auth views. Deep-merged over the library's
 * English defaults; any `localization` prop passed to `<AuthProvider>`
 * still wins over these strings.
 */
const esLocalization: DeepPartial<Localization> = {
    auth: {
        account: "Cuenta",
        alreadyHaveAnAccount: "¿Ya tiene una cuenta?",
        alreadyVerifiedYourEmail: "¿Ya verificó su correo?",
        checkYourEmail: "Revise su correo: le enviamos un enlace de verificación",
        checkYourEmailTitle: "Revise su correo",
        confirmPassword: "Confirmar contraseña",
        confirmPasswordPlaceholder: "Confirme su contraseña",
        continueWith: "Continuar con {{provider}}",
        email: "Correo electrónico",
        emailPlaceholder: "correo@ejemplo.com",
        fieldRequired: "Este campo es obligatorio",
        forgotPassword: "Recuperar contraseña",
        forgotPasswordLink: "¿Olvidó su contraseña?",
        hidePassword: "Ocultar contraseña",
        invalidEmail: "Ingrese un correo válido",
        invalidResetPasswordToken: "El enlace de restablecimiento no es válido",
        name: "Nombre",
        namePlaceholder: "Nombre",
        needToCreateAnAccount: "¿Necesita crear una cuenta?",
        newPassword: "Nueva contraseña",
        newPasswordPlaceholder: "Nueva contraseña",
        openEmailProvider: "Abrir {{provider}}",
        optional: " (opcional)",
        or: "O",
        password: "Contraseña",
        passwordPlaceholder: "Contraseña",
        passwordResetEmailSent: "Correo de restablecimiento enviado",
        passwordResetErrorDescription:
            "No se pudo restablecer la contraseña. Intente de nuevo.",
        passwordResetSuccess: "Contraseña restablecida",
        passwordResetSuccessDescription:
            "Contraseña restablecida. Ya puede iniciar sesión con su nueva contraseña.",
        passwordsDoNotMatch: "Las contraseñas no coinciden",
        rememberMe: "Recordarme",
        rememberYourPassword: "¿Recordó su contraseña?",
        resend: "Reenviar",
        resendIn: "Reenviar en {{seconds}}s",
        resetLinkSentTo:
            "Enviamos un enlace de restablecimiento a {{email}}",
        resetPassword: "Restablecer contraseña",
        scanToOpenEmailProvider:
            "Escanee para abrir {{provider}} en su teléfono",
        sendResetLink: "Enviar enlace",
        showPassword: "Mostrar contraseña",
        signIn: "Iniciar sesión",
        signOut: "Cerrar sesión",
        signUp: "Crear cuenta",
        tooLong: "Debe tener máximo {{max}} caracteres",
        tooShort: "Debe tener mínimo {{min}} caracteres",
        verificationEmailSent: "Correo de verificación enviado",
        verifyEmail: "Verificar correo",
    },
};

/**
 * Provides an authentication context by rendering an auth provider with the sonner toast handler injected, forwarding remaining configuration and rendering `children` inside it.
 *
 * Applies the Centinela Spanish (CO) localization by default; explicit
 * `localization` overrides passed by the caller take precedence.
 *
 * @param children - React nodes to render inside the authentication provider
 * @returns A React element that renders an authentication provider configured with the provided props and toast handler
 */
export function AuthProvider({
    children,
    localization,
    ...config
}: AuthProviderProps) {
    return (
        <AuthProviderPrimitive
            {...config}
            localization={deepmerge(esLocalization, localization ?? {})}
        >
            {children}

            <ErrorToaster />
        </AuthProviderPrimitive>
    );
}
