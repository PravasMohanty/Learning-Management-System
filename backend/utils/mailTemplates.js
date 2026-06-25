// utils/emailTemplates.js

// ======================================================
// APPROVAL EMAIL
// ======================================================

const approvalEmailTemplate = (name) => {
  return {
    subject: "Registration Approved",

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome ${name} 🎉</h2>

        <p>
          Your registration request has been approved successfully.
        </p>

        <p>
          Your LMS account is now active and ready to use.
        </p>

        <p>
          You can now login and start learning.
        </p>

        <br />

        <p>Best Regards,</p>
        <p><strong>LMS Team</strong></p>
      </div>
    `,
  };
};

// ======================================================
// REJECTION EMAIL
// ======================================================

const rejectionEmailTemplate = (name, reason = "") => {
  return {
    subject: "Registration Request Update",

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name}</h2>

        <p>
          We regret to inform you that your registration request
          has been rejected.
        </p>

        ${
          reason
            ? `
            <p>
              <strong>Reason:</strong> ${reason}
            </p>
          `
            : ""
        }

        <p>
          If you believe this was a mistake,
          please contact support.
        </p>

        <br />

        <p>Best Regards,</p>
        <p><strong>LMS Team</strong></p>
      </div>
    `,
  };
};

// ======================================================
// APPROVAL FAILED EMAIL
// ======================================================

const approvalFailedTemplate = (name) => {
  return {
    subject: "Registration Processing Issue",

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name}</h2>

        <p>
          Your registration request was approved,
          but we encountered an issue while setting up your account.
        </p>

        <p>
          Please contact support for assistance.
        </p>

        <br />

        <p>Best Regards,</p>
        <p><strong>LMS Team</strong></p>
      </div>
    `,
  };
};

const passwordResetTemplate = (name, otp) => {
  return `
    <div>
      <h2>CodeForge LMS</h2>

      <p>Hello ${name},</p>

      <p>
        We received a request to reset your password.
      </p>

      <p>
        Use the following OTP to reset your password:
      </p>

      <h1>${otp}</h1>

      <p>
        This OTP will expire in 10 minutes.
      </p>

      <p>
        If you did not request this password reset,
        please ignore this email.
      </p>

      <br />

      <p>Regards,</p>
      <p>CodeForge LMS Team</p>
    </div>
  `;
};


module.exports = {
  approvalEmailTemplate,
  rejectionEmailTemplate,
  approvalFailedTemplate,
  passwordResetTemplate 
};