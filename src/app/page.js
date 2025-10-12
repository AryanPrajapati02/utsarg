import Link from 'next/link'
import { Heart, Users, Target, Shield, ArrowRight, CheckCircle, TrendingUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 sm:space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-neutral-900">
              Connecting Hearts,<br />
              <span className="text-primary-600">Creating Impact</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-neutral-600 max-w-3xl mx-auto px-4">
              Join our transparent platform where NGOs, donors, and volunteers unite to create meaningful social change
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">
                  Get Started Today
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/campaigns" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">
                  Browse Campaigns
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-600">$30,000</div>
              <div className="text-xs sm:text-sm lg:text-base text-neutral-600 mt-1 sm:mt-2">Budget Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-600">500+</div>
              <div className="text-xs sm:text-sm lg:text-base text-neutral-600 mt-1 sm:mt-2">Verified NGOs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent-600">10K+</div>
              <div className="text-neutral-600 mt-2">Active Donors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">25K+</div>
              <div className="text-neutral-600 mt-2">Volunteers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              We provide transparency, accountability, and seamless connections for maximum social impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Verified NGOs</h3>
              <p className="text-neutral-600">
                All NGOs undergo strict verification with DARPAN ID validation and admin approval
              </p>
            </Card>

            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Real-time Tracking</h3>
              <p className="text-neutral-600">
                Track your donations and see real-time updates on how funds are being utilized
              </p>
            </Card>

            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Multiple Ways to Help</h3>
              <p className="text-neutral-600">
                Donate money, clothes, food, blood, or volunteer your time for meaningful causes
              </p>
            </Card>

            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Targeted Campaigns</h3>
              <p className="text-neutral-600">
                Find campaigns that match your interests and location for maximum impact
              </p>
            </Card>

            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Secure Payments</h3>
              <p className="text-neutral-600">
                Integrated with Razorpay for secure and seamless donation transactions
              </p>
            </Card>

            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto">
                {/* <Heart className="w-8 h-8 text-accent-600" /> */}
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Community Driven</h3>
              <p className="text-neutral-600">
                Join a community of like-minded individuals working towards social change
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured NGOs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Verified NGOs Making Impact
            </h2>
            <p className="text-xl text-neutral-600">
              Connect with trusted organizations working across various causes
            </p>
          </div>

          <div className="text-center mb-12">
            <Link href="/ngos">
              <Button size="lg" className="px-8 py-4">
                View All NGOs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">500+ Verified NGOs</h3>
              <p className="text-neutral-600">
                All NGOs undergo strict verification with DARPAN ID validation and admin approval
              </p>
            </Card>

            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Multiple Categories</h3>
              <p className="text-neutral-600">
                Find NGOs working in education, healthcare, environment, women empowerment, and more
              </p>
            </Card>

            <Card className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Location-Based Search</h3>
              <p className="text-neutral-600">
                Discover NGOs in your city or state to support local community initiatives
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-neutral-600">
              Simple steps to start making a difference
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Register & Verify</h3>
              <p className="text-neutral-600">
                Sign up as an NGO, donor, or volunteer. NGOs undergo verification process for authenticity.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-secondary-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Create or Find Campaigns</h3>
              <p className="text-neutral-600">
                NGOs create campaigns for their causes. Donors and volunteers discover opportunities to help.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-accent-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Make Impact & Track Progress</h3>
              <p className="text-neutral-600">
                Contribute to causes and track the real-time impact of your donations and volunteer work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-neutral-600">
            Join thousands of changemakers who are creating positive impact in their communities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?type=ngo">
              <Button size="lg" className="px-8 py-4">
                Register Your NGO
              </Button>
            </Link>
            <Link href="/register?type=donor">
              <Button variant="outline" size="lg" className="px-8 py-4">
                Start Donating
              </Button>
            </Link>
            <Link href="/register?type=volunteer">
              <Button variant="outline" size="lg" className="px-8 py-4">
                Become a Volunteer
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}