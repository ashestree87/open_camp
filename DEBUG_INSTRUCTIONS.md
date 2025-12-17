# Debug Instructions

## Check if you're authenticated:

Open browser console (F12) and run:

```javascript
console.log('Token:', localStorage.getItem('opencamp_admin_token'))
```

If it returns `null`, you need to login first at `/admin`.

## Test the API directly:

Run this in the browser console:

```javascript
const token = localStorage.getItem('opencamp_admin_token');
fetch('https://camp.eighty7.uk/api/camps', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Test Camp Direct',
    description: 'Testing',
    startDate: '2025-08-01',
    endDate: '2025-08-05',
    ageMin: 5,
    ageMax: 12,
    maxSpots: 20,
    status: 'active'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

This will show the EXACT error response.

