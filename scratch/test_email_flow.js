const testRegistration = async () => {
  try {
    const testEmail = `test.care.${Date.now()}@gmail.com`
    console.log('1. Registering caretaker:', testEmail)
    const regRes = await fetch('http://localhost:5000/api/caretaker/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavitha Devi',
        email: testEmail,
        phone: '9876543210',
        specialty: 'Home Nursing Services',
        experience: 4,
        experienceDetails: 'Specialized ICU home care & elderly support',
        workingLocations: 'Gachibowli, Madhapur, Kondapur',
        availableTimings: 'Day & Night Shifts',
        state: 'Telangana',
        city: 'Hyderabad'
      })
    })
    const regData = await regRes.json()
    console.log('Registration Response:', regData)

    if (regData.success && regData.caretaker) {
      console.log('2. Testing Admin Approval for caretaker ID:', regData.caretaker.id)
      const token = 'mock-jwt-admin-token-ammaseva'
      const approveRes = await fetch(`http://localhost:5000/api/caregiver/${regData.caretaker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Verified' })
      })
      const approveData = await approveRes.json()
      console.log('Approval Response:', approveData)
    }
  } catch (err) {
    console.error('Test error:', err)
  }
}

testRegistration()
