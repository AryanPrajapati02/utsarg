'use client'

import PublicLayout from '@/components/layout/PublicLayout'
import Card from '@/components/ui/Card'
import { FileText, Calendar } from 'lucide-react'

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using the Utsarg platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      title: '2. Platform Description',
      content: `Utsarg is an online platform that connects donors with verified Non-Governmental Organizations (NGOs) to facilitate charitable donations and volunteer opportunities. We provide a transparent and secure environment for charitable giving.`
    },
    {
      title: '3. User Accounts',
      content: `To access certain features of our platform, you must register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.`
    },
    {
      title: '4. Donations',
      content: `All donations made through our platform are voluntary and non-refundable unless required by law. We facilitate the transfer of donations to verified NGOs but are not responsible for how the NGOs use the donated funds. Tax receipts will be provided as per applicable laws.`
    },
    {
      title: '5. NGO Verification',
      content: `While we make reasonable efforts to verify the legitimacy of NGOs on our platform, we do not guarantee the accuracy of all information provided by NGOs. Users should conduct their own due diligence before making donations.`
    },
    {
      title: '6. User Conduct',
      content: `You agree not to use the platform for any unlawful purpose or in any way that could damage, disable, overburden, or impair our services. You will not attempt to gain unauthorized access to any part of the platform or any other systems or networks connected to the platform.`
    },
    {
      title: '7. Privacy and Data Protection',
      content: `Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our platform. By using our services, you agree to the collection and use of information in accordance with our Privacy Policy.`
    },
    {
      title: '8. Payment Processing',
      content: `We use third-party payment processors to handle donations. By making a donation, you agree to the terms and conditions of our payment processors. We are not responsible for any issues arising from payment processing.`
    },
    {
      title: '9. Intellectual Property',
      content: `The platform and its original content, features, and functionality are owned by Utsarg and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.`
    },
    {
      title: '10. Disclaimers',
      content: `The information on this platform is provided on an "as is" basis. We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability and fitness for a particular purpose.`
    },
    {
      title: '11. Limitation of Liability',
      content: `In no event shall Utsarg be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.`
    },
    {
      title: '12. Termination',
      content: `We may terminate or suspend your account and bar access to the platform immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.`
    },
    {
      title: '13. Governing Law',
      content: `These Terms shall be interpreted and governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.`
    },
    {
      title: '14. Changes to Terms',
      content: `We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.`
    },
    {
      title: '15. Contact Information',
      content: `If you have any questions about these Terms and Conditions, please contact us at legal@utsarg.org or through our contact page.`
    }
  ]

  return (
    // <PublicLayout showSidebar={true}>
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms and Conditions
          </h1>
          <div className="flex items-center justify-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Last updated: December 15, 2024</span>
          </div>
        </div>

        {/* Introduction */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Utsarg</h2>
          <p className="text-gray-600 mb-4">
            These Terms and Conditions ("Terms", "Terms and Conditions") govern your relationship with
            the Utsarg platform operated by Utsarg ("us", "we", or "our").
          </p>
          <p className="text-gray-600">
            Please read these Terms and Conditions carefully before using our platform. Your access to
            and use of the platform is conditioned on your acceptance of and compliance with these Terms.
          </p>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {section.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {section.content}
              </p>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card className="p-8 mt-8 bg-blue-50 border-blue-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              Questions About Our Terms?
            </h3>
            <p className="text-blue-800 mb-6">
              If you have any questions about these Terms and Conditions, please don't hesitate to contact us.
            </p>
            <div className="space-y-2">
              <p className="text-blue-700">
                <strong>Email:</strong> legal@utsarg.org
              </p>
              <p className="text-blue-700">
                <strong>Phone:</strong> +91 98765 43210
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
    // </PublicLayout>
  )
}