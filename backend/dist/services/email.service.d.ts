export interface EmailProvider {
    sendEmail(to: string, subject: string, content: EmailContent): Promise<boolean>;
}
export interface EmailContent {
    html: string;
    text: string;
}
export declare class EmailTemplates {
    static emailVerification(verificationToken: string, userFirstName: string): EmailContent;
    static passwordReset(resetToken: string, userFirstName: string): EmailContent;
    static securityAlert(alertType: string, userFirstName: string, details: string): EmailContent;
}
export declare class EmailVerificationService {
    private emailProvider;
    constructor(emailProvider?: EmailProvider);
    generateVerificationToken(): string;
    sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<boolean>;
    sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<boolean>;
    sendSecurityAlert(email: string, firstName: string, alertType: string, details: string): Promise<boolean>;
}
export declare const emailService: EmailVerificationService;
//# sourceMappingURL=email.service.d.ts.map