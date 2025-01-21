const TermsOfService = () => {
  return (
    <div style={{ margin: 30 }}>
      <h2>Terms of Service</h2>
      <p>
        These Terms of Service (these “Terms”) are a legal agreement between you
        and Y (“Y,” “we,” “our,” or “us”). These Terms specify the terms under
        which you may access and use Y’s website and web application located at
        ynot.lol (the “Site”) and related services, including but not limited to
        tools for discovering and sharing projects, publishing content,
        blogging, microblogging, sharing media, and other interactive features
        (collectively, the “Service”).
      </p>
      <ol>
        <li>
          By opting into Y SMS authentication, you agree to receive one-time
          passcodes (OTPs) via SMS for the purpose of two-factor authentication
          (2FA) to secure your account.
        </li>
        <li>
          You can cancel the SMS service at any time by unlinking your phone
          number in your account settings. Please note that opting out of SMS
          will disable 2FA for your account. If you wish to re-enable SMS 2FA,
          you can opt back in through your account settings.
        </li>
        <li>
          If you experience issues with receiving OTPs, contact us at{" "}
          <a href="mailto:arnav@ynot.lol">arnav@ynot.lol</a> or{" "}
          <a href="andrea@ynot.lol">andrea@ynot.lol</a>.
        </li>
        <li>Carriers are not liable for delayed or undelivered messages.</li>
        <li>
          Message and data rates may apply for any text message sent from us.
          For questions about your text or data plan, please contact your
          wireless provider.
        </li>
        <li>
          For information on how we handle your data, please review our{" "}
          <a href="/privacy-policy">privacy policy</a>.
        </li>
      </ol>
    </div>
  );
};

export default TermsOfService;
