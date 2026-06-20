import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function SecurityCenter() {
  return (
    <>
      <Header />
      <main className="py-24 px-6 bg-secondary/5 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-16 rounded-[40px] shadow-sm border border-secondary/10">
          <h1 className="text-4xl md:text-6xl font-serif font-black italic text-primary mb-2 tracking-tight">
            Haybolbay Security Center
          </h1>
          <p className="text-neutral-500 font-medium mb-12 italic">
            Your Safety Matters | Last Updated: June 2026
          </p>

          <div className="space-y-10 text-neutral-700 leading-relaxed font-medium">
            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                1. Your Safety Matters
              </h2>
              <p>
                Haybolbay is committed to helping hosts, tenants, homeowners, service providers, and guests use our platform safely and securely.
              </p>
              <p>
                We continuously improve our systems, processes, and security controls to protect accounts, personal information, and transactions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                2. Privacy-First Design
              </h2>
              <p>
                Haybolbay believes privacy is a fundamental part of trust. We design our platform using the principle of collecting only the information necessary to provide our services.
              </p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Collect only the information required for bookings, communications, payments, and safety.</li>
                <li>Limit access to personal information to authorized personnel with a legitimate business need.</li>
                <li>Protect user information using industry-standard security practices.</li>
                <li>Retain information only for as long as necessary to meet legal, operational, or security requirements.</li>
                <li>Continuously review our systems to reduce unnecessary collection and exposure of personal data.</li>
              </ul>
              <p>
                Haybolbay does not sell personal information to third parties. Our goal is to give users confidence that their information is handled responsibly and respectfully.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                3. Our Data Access Principles
              </h2>
              <p>
                Haybolbay follows strict internal principles regarding access to user information.
              </p>

              <div className="space-y-6 ml-4">
                <div>
                  <h3 className="font-bold text-primary mb-1 uppercase tracking-wider text-sm">Need-to-Know Access</h3>
                  <p className="text-sm">
                    Access to personal information is limited to authorized personnel who require it to perform operational, support, safety, or legal functions.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-1 uppercase tracking-wider text-sm">Limited Visibility</h3>
                  <p className="text-sm">
                    Where practical, sensitive information may be partially masked or hidden from users, service providers, and internal personnel.
                  </p>
                  <ul className="list-disc ml-6 mt-2 space-y-1 text-sm italic">
                    <li>Partial display of mobile numbers</li>
                    <li>Partial display of email addresses</li>
                    <li>Limited visibility of payment information</li>
                    <li>Restricted access to account verification records</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-1 uppercase tracking-wider text-sm">No Unauthorized Monitoring</h3>
                  <p className="text-sm">
                    Haybolbay personnel do not routinely access private user information unless required for customer support requests, security investigations, fraud prevention, legal obligations, or regulatory obligations.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-1 uppercase tracking-wider text-sm">Audit and Accountability</h3>
                  <p className="text-sm">
                    Access to sensitive information may be logged and reviewed to help ensure accountability and protect our users.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                4. How We Communicate With You
              </h2>
              <p>Haybolbay may contact you through:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Email notifications</li>
                <li>SMS notifications</li>
                <li>Mobile app notifications</li>
                <li>Official customer support channels</li>
              </ul>
              <p>
                Official communications will only come from Haybolbay-approved domains and channels. If you receive a suspicious message claiming to be from Haybolbay, do not click any links or provide personal information until you verify its authenticity.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                5. Haybolbay Will Never Ask For
              </h2>
              <p>For your protection, Haybolbay will never ask you to provide:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Passwords</li>
                <li>One-Time Passwords (OTP)</li>
                <li>GCash PIN</li>
                <li>Maya PIN</li>
                <li>Bank account passwords</li>
                <li>Credit card PINs</li>
                <li>Authentication codes from your device</li>
              </ul>
              <p>
                Anyone requesting this information is likely attempting fraud.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                6. Verify Before You Click
              </h2>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Check that the website address belongs to Haybolbay.</li>
                <li>Be cautious of misspellings or unusual domain names.</li>
                <li>If unsure, open the Haybolbay application directly instead of clicking the link.</li>
                <li>For important account actions, access your account through the official Haybolbay application.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                7. Account Security Tips
              </h2>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Use a strong password.</li>
                <li>Enable available security features.</li>
                <li>Keep mobile numbers and email addresses up to date.</li>
                <li>Avoid sharing account credentials.</li>
                <li>Log out of shared devices.</li>
                <li>Review account activity regularly.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                8. Security Notifications
              </h2>
              <p>Haybolbay may send alerts when:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Your email address is changed.</li>
                <li>Your mobile number is updated.</li>
                <li>A password reset is requested.</li>
                <li>A new device logs into your account.</li>
                <li>Important account information is modified.</li>
              </ul>
              <p>
                If you receive a notification for an action you did not perform, contact Haybolbay immediately.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                9. Reporting Suspicious Activity
              </h2>
              <p>Please report immediately if you notice:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Unauthorized account access</li>
                <li>Suspicious emails or messages</li>
                <li>Fake Haybolbay websites</li>
                <li>Payment fraud attempts</li>
                <li>Identity theft concerns</li>
              </ul>
              <p>
                Contact: security@haybolbay.com
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">
                10. Responsible Use
              </h2>
              <p>
                Users are responsible for maintaining the confidentiality of their account credentials and for all activities conducted through their account.
              </p>
              <p>
                Haybolbay reserves the right to investigate suspicious activity and temporarily restrict access when necessary to protect users and the platform.
              </p>
            </section>

            <section className="space-y-6 bg-secondary/5 p-8 rounded-3xl mt-12 italic text-primary/80 border border-primary/10">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary">
                11. Continuous Improvement
              </h2>
              <p className="text-sm">
                Security threats evolve constantly. Haybolbay regularly reviews and improves its security practices, policies, and technical controls to help safeguard our community.
              </p>
              <p className="text-sm">
                Last Updated: June 2026
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

