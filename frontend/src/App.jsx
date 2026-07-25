import { useState, useEffect } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('all')
  const [donationAmount, setDonationAmount] = useState(50)
  const [volunteerName, setVolunteerName] = useState('')
  const [volunteerEmail, setVolunteerEmail] = useState('')
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [services, setServices] = useState([])

  const icons = {
    elderly: (
      <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    food: (
      <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    health: (
      <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    education: (
      <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  }

  useEffect(() => {
    fetch('http://localhost:5000/api/services')
      .then(res => res.json())
      .then(data => {
        const servicesWithIcons = data.map(item => ({
          ...item,
          icon: icons[item.id] || null
        }))
        setServices(servicesWithIcons)
      })
      .catch(err => {
        console.error('Error fetching services from backend:', err)
        // Fallback local dataset if backend is offline
        const fallback = [
          { id: 'elderly', title: 'Elderly Care & Companion', category: 'care', description: 'Assisting senior citizens with daily essentials, healthcare companionship, and emotional support.', icon: icons.elderly },
          { id: 'food', title: 'Nutritious Meals (Anna Seva)', category: 'food', description: 'Preparing and distributing warm, healthy meals daily to impoverished families and individuals.', icon: icons.food },
          { id: 'health', title: 'Medical Camps & Aid', category: 'health', description: 'Providing free health checkups, essential medicines, and vision correction camps in underserved rural regions.', icon: icons.health },
          { id: 'education', title: 'Youth & Children Empowerment', category: 'education', description: 'Conducting after-school tutoring, computer literacy classes, and supplying learning kits to kids.', icon: icons.education }
        ]
        setServices(fallback)
      })
  }, [])

  const stats = [
    { label: 'Meals Distributed', value: '120k+' },
    { label: 'Lives Impacted', value: '45,000+' },
    { label: 'Active Volunteers', value: '850+' },
    { label: 'Support Centers', value: '12' }
  ]

  const filteredServices = activeTab === 'all' 
    ? services 
    : services.filter(s => s.category === activeTab)

  const handleVolunteerSubmit = (e) => {
    e.preventDefault()
    if (volunteerName && volunteerEmail) {
      fetch('http://localhost:5000/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: volunteerName, email: volunteerEmail })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setVolunteerSubmitted(true)
            setTimeout(() => {
              setVolunteerSubmitted(false)
              setVolunteerName('')
              setVolunteerEmail('')
            }, 4000)
          } else {
            console.error('Registration failed:', data.error)
          }
        })
        .catch(err => {
          console.error('Error registering volunteer:', err)
          // Fallback simulation
          setVolunteerSubmitted(true)
          setTimeout(() => {
            setVolunteerSubmitted(false)
            setVolunteerName('')
            setVolunteerEmail('')
          }, 4000)
        })
    }
  }

  const handleDonationSubmit = () => {
    fetch('http://localhost:5000/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: donationAmount })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(`Thank you for donating $${donationAmount}! Your donation has been recorded on our backend.`)
        } else {
          alert(`Donation failed: ${data.error}`)
        }
        setShowModal(false)
      })
      .catch(err => {
        console.error('Error posting donation:', err)
        alert(`Thank you for donating $${donationAmount}! (Offline demonstration mode)`)
        setShowModal(false)
      })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-rose-500/20">
              A
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-indigo-400">
                Amma Seva
              </span>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase font-semibold">Care & Compassion</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#about" className="hover:text-rose-400 transition-colors">Our Vision</a>
            <a href="#services" className="hover:text-rose-400 transition-colors">Services</a>
            <a href="#stats" className="hover:text-rose-400 transition-colors">Impact</a>
            <a href="#volunteer" className="hover:text-rose-400 transition-colors">Join Us</a>
          </nav>

          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Donate Now
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="about" className="relative pt-20 pb-24 md:pt-32 md:pb-40 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-6 inline-block">
            Empowering Lives, Restoring Hope
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
            Serving with Pure Love <br />
            &amp; <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-400">Selfless Compassion</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Amma Seva is dedicated to bringing dignity, nutrition, healthcare, and education to those who need it most. Together, we make the world a warmer place.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="#volunteer"
              className="px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-semibold hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            >
              Become a Volunteer
            </a>
            <button 
              onClick={() => setShowModal(true)}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-semibold shadow-xl shadow-rose-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Support Our Work
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 bg-slate-900/50 border-y border-slate-900 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-6 rounded-2xl bg-slate-950/40 border border-slate-900/80">
              <span className="block text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400 mb-2">
                {stat.value}
              </span>
              <span className="text-xs md:text-sm text-slate-400 font-medium tracking-wide uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Our Core Initiatives</h2>
            <p className="text-slate-400 max-w-xl">
              We focus on basic human rights: food security, geriatric health care, child development, and clean community support.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-6 md:mt-0 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            {['all', 'care', 'food', 'health', 'education'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {filteredServices.map((service) => (
            <div 
              key={service.id} 
              className="group p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 hover:border-slate-800 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-rose-500/5 duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-slate-800/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-rose-400 transition-colors">
                {service.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {service.description}
              </p>
              <a 
                href="#volunteer"
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-rose-400 transition-colors uppercase tracking-wider"
              >
                Get Involved 
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Volunteer Registration */}
      <section id="volunteer" className="py-24 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-900 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-extrabold mb-4">Be the Change</h2>
            <p className="text-slate-400 text-sm">
              Join hands with Amma Seva. Your time, skills, and empathy can uplift individuals and bring smiles to communities.
            </p>
          </div>

          <form onSubmit={handleVolunteerSubmit} className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Name</label>
              <input 
                type="text" 
                required
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                placeholder="Enter name" 
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none text-slate-200 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={volunteerEmail}
                onChange={(e) => setVolunteerEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none text-slate-200 transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold tracking-wider hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              Sign Up as Volunteer
            </button>

            {volunteerSubmitted && (
              <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm text-center">
                ✨ Thank you, <strong>{volunteerName}</strong>! We've received your interest and will reach out shortly.
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-white">
              A
            </div>
            <span className="font-bold text-lg text-slate-300">Amma Seva</span>
          </div>
          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} Amma Seva Foundation. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-rose-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-rose-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Interactive Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 relative shadow-2xl">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold mb-2">Support Our Cause</h3>
            <p className="text-sm text-slate-400 mb-6">
              Your donation directly funds daily warm meals, medical checks, and kids' kits.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Choose Amount ($)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        donationAmount === amt 
                          ? 'bg-rose-500 border-rose-500 text-white' 
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Custom Amount ($)</label>
                <input 
                  type="number" 
                  value={donationAmount} 
                  onChange={(e) => setDonationAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none text-slate-200"
                />
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex gap-3">
                <svg className="w-6 h-6 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>
                  A donation of <strong>${donationAmount}</strong> provides nutritious food or medicine for up to <strong>{Math.floor(donationAmount / 5)}</strong> families.
                </p>
              </div>

              <button 
                onClick={handleDonationSubmit}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold tracking-wider hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Proceed to Secure Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
