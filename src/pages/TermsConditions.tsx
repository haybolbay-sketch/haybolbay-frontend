import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function TermsConditions() {
  return (
    <>
      <Header />
      <main className="py-24 px-6 bg-secondary/5 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-16 rounded-[40px] shadow-sm border border-secondary/10">
          <h1 className="text-4xl md:text-6xl font-serif font-black italic text-primary mb-2 tracking-tight">Terms and Conditions</h1>
          <p className="text-neutral-500 font-medium mb-12 italic">Effective Date: 12 May 2026</p>
          
          <div className="space-y-10 text-neutral-700 leading-relaxed font-medium">
            <section className="space-y-4">
              <p>
                Welcome to Haybolbay. These Terms and Conditions (“Terms”) govern the use of the Haybolbay platform, website, mobile services, and related applications (“Platform”).
              </p>
              <p>
                By accessing or using the Platform, you agree to comply with these Terms. If you do not agree, please discontinue use of the Platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">1. About Haybolbay</h2>
              <p>Haybolbay is a digital booking and coordination platform that connects:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Property owners, landlords, Airbnb hosts, tenants, or administrators (“Hosts”)</li>
                <li>Independent service providers such as cleaners, housekeeping personnel, maintenance workers, and similar providers (“Service Providers”)</li>
              </ul>
              <p>Haybolbay facilitates scheduling, coordination, communication, and payments where applicable.</p>
              <p>Haybolbay is not an employer, staffing agency, contractor, insurer, or property management company unless explicitly stated otherwise in writing.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">2. Eligibility</h2>
              <p>To use the Platform, users must:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Be at least 18 years old</li>
                <li>Provide accurate registration information</li>
                <li>Maintain the security of their account</li>
                <li>Use the Platform lawfully and responsibly</li>
              </ul>
              <p>Haybolbay reserves the right to suspend or terminate accounts that provide false information or violate these Terms.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">3. Nature of Services</h2>
              <p>Haybolbay only provides the Platform infrastructure and coordination tools.</p>
              <p>Haybolbay does not:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Guarantee the quality, legality, safety, punctuality, or suitability of any service</li>
                <li>Supervise or control Service Providers during actual work</li>
                <li>Guarantee bookings, availability, or uninterrupted service</li>
                <li>Guarantee the condition, cleanliness, legality, or safety of any property</li>
              </ul>
              <p>All agreements, engagements, and transactions between Hosts and Service Providers are entered into at their own discretion and risk.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">4. Independent Relationship</h2>
              <p>Service Providers are independent parties and are not employees, agents, partners, or representatives of Haybolbay.</p>
              <p>Hosts and Service Providers acknowledge that:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>They are solely responsible for their own conduct</li>
                <li>They are responsible for complying with applicable laws, taxes, permits, insurance, labor regulations, and property rules</li>
                <li>Haybolbay does not direct or control how services are performed</li>
              </ul>
              <p>Nothing in these Terms creates an employment, agency, partnership, or joint venture relationship with Haybolbay.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">5. User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-primary mb-1 uppercase tracking-wider text-sm">Hosts agree to:</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm italic">
                    <li>Provide accurate property and booking information</li>
                    <li>Ensure safe working conditions</li>
                    <li>Secure valuables and sensitive items</li>
                    <li>Comply with condominium, building, and local regulations</li>
                    <li>Treat Service Providers fairly and respectfully</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1 uppercase tracking-wider text-sm">Service Providers agree to:</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm italic">
                    <li>Perform services professionally and lawfully</li>
                    <li>Maintain required permits, certifications, or qualifications where applicable</li>
                    <li>Respect property rules and guest privacy</li>
                    <li>Avoid theft, damage, misconduct, harassment, or illegal activities</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">6. Payments and Fees</h2>
              <p>Haybolbay may facilitate payments through third-party providers such as: Stripe, Xendit, GCash, PayNow, Maya, or other supported providers.</p>
              <p>Haybolbay may charge platform, convenience, service, or transaction fees.</p>
              <p>Users acknowledge:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm italic">
                <li>Third-party payment processors may impose separate terms and fees</li>
                <li>Refunds, disputes, chargebacks, and payout timelines may vary</li>
                <li>Haybolbay may temporarily hold funds for fraud prevention, verification, disputes, or operational purposes</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">7. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, Haybolbay, its owners, founders, officers, employees, affiliates, subsidiaries, contractors, partners, and representatives shall not be liable for:</p>
              <ul className="list-disc ml-6 space-y-1 text-sm italic">
                <li>Injury, death, accidents, or medical incidents</li>
                <li>Theft, fraud, misconduct, or criminal acts</li>
                <li>Property damage or loss</li>
                <li>Poor workmanship or unsatisfactory service</li>
                <li>Guest complaints or business losses</li>
                <li>Booking cancellations or no-shows</li>
                <li>Data loss, service interruption, or technical downtime</li>
                <li>Condominium, landlord, Airbnb, or local regulatory violations</li>
                <li>Disputes between Hosts and Service Providers</li>
              </ul>
              <p>All users use the Platform at their own risk. Haybolbay’s total liability, if any, shall not exceed the amount of fees directly paid to Haybolbay for the specific transaction involved.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">8. Insurance and Risk</h2>
              <p>Users acknowledge that Haybolbay does not currently provide: Worker insurance, Property insurance, Liability insurance, Accident insurance, or Theft protection guarantees.</p>
              <p>Hosts and Service Providers are encouraged to obtain their own insurance coverage where appropriate.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">9. User Content and Communications</h2>
              <p>Users grant Haybolbay a non-exclusive license to use submitted content (messages, reviews, photos, property details) for Platform operations, customer support, security, and promotional purposes.</p>
              <p>Users must not upload: Illegal or abusive material, false information, copyright-infringing content, malware or harmful code.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">10. Account Suspension and Termination</h2>
              <p>Haybolbay reserves the right to suspend, restrict, or terminate accounts that: Violate these Terms, engage in fraud or abuse, threaten platform security, or harm other users or the reputation of the Platform.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">11. Third-Party Services</h2>
              <p>Haybolbay is not responsible for outages, failures, or security incidents originating from third-party services like mapping, payment gateways, messaging, authentication, or cloud hosting.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">12. Data and Privacy</h2>
              <p>Use of the Platform is also governed by the Haybolbay Privacy Policy. Users consent to the collection and processing of information necessary for operations.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">13. Modifications to the Platform</h2>
              <p>Haybolbay may modify features, change pricing, introduce new policies, or suspend portions of the Platform without prior notice.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">14. Governing Law</h2>
              <p>These Terms shall be governed by applicable laws of the Republic of the Philippines. Disputes shall first be attempted to be resolved amicably.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit">15. Contact Information</h2>
              <p>For questions or concerns: Haybolbay Support. Email: support@haybolbay.com. Website: Haybolbay Official Website.</p>
            </section>

            <section className="space-y-4 italic text-primary/80">
              <h2 className="text-2xl font-serif font-bold text-gray-900 border-b-2 border-primary/10 pb-2 w-fit uppercase tracking-widest text-sm">16. Acknowledgment</h2>
              <p>By using the Platform, users acknowledge that they have read, understood, and agree to be legally bound by these Terms, and accept the inherent risks of using a digital marketplace.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
