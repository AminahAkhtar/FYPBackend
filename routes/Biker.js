const express = require('express');
const Biker = require('../models/Biker');
const Franchiser = require('../models/Franchiser');
const SwapRequest = require('../models/SwapRequest');
const router = express.Router();
const bcrypt = require('bcryptjs')
const {body, validationResult} = require('express-validator')
const jwt = require('jsonwebtoken'); 
const nodemailer = require('nodemailer');
// const twilio = require('twilio');


// var fetchuser = require('../middleware/fetchuser')
const JWT_SECRET = 'bshm'
// Twilio credentials
// const accountSid = 'ACcca203ffd70eb376506f113bf53ce8ee';
// const authToken = 'f991c04c13c4dcb67969d7e608b12ed4';
// const twilioClient = twilio(accountSid, authToken);


router.post('/registerbiker', [
    body('name', 'Enter a valid name').isLength({min:3}),
    body('email', 'Enter a valid email').isEmail(),
    body('password','Password must be atleast 5 characters').isLength({min:5}),
    body('phoneNumber', 'Phone number must be 11 digits starting with 0').matches(/^0\d{10}$/)
], async (req,res) => {
  let success=false;
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({success, errors:errors.array()});
  }

try{


  let user = await Biker.findOne({email: req.body.email});
  if (user) {
    return res.status(400).json({success,error :"Email already exists"})
  }

  const salt = await bcrypt.genSalt(10);
  const secPass = await  bcrypt.hash(req.body.password,salt);
  //create new user
  user = await Biker.create({
    name:req.body.name,
    password: secPass,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    location: {
      type: 'Point',
      coordinates: [req.body.location.coordinates[0], req.body.location.coordinates[1]] // Use provided coordinates
  }


})

const data = {
  user:{
    id:user.id
  }
}

const authtoken = jwt.sign(data, JWT_SECRET);
success =true;
res.json({success, authtoken})

}catch(error){
    console.log(error.message);
    res.status(500).send("Internal server error");

}
})





router.post('/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password cannot be blank').exists(),
], async (req,res) => {
   
   const errors = validationResult(req);
   if(!errors.isEmpty()){
     return res.status(400).json({errors:errors.array()});
   }

   const {email,password} = req.body;
   try {
     let user = await Biker.findOne({email});
     if(!user){
      return res.status(400).json({error:"Please login with correct credentials"});
     }


     const passwordCompare = await bcrypt.compare(password, user.password);
     if(!passwordCompare){
      success= false
      return res.status(400).json({success, error:"Please login with correct credentials"});
     }

     const data = {
      user:{
        id:user.id
      }
    }
    
    const authtoken = jwt.sign(data, JWT_SECRET);
    success = true
    res.json({success, authtoken})
    
   } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
   }
 

})



// POST request to store a new biker record by phone number
router.post('/bikerregister', async (req, res) => {
  try {
      const { phoneNumber } = req.body;

      // Check if the biker with the provided phone number already exists
      let biker = await Biker.findOne({ phoneNumber });

      // If the biker doesn't exist, create a new record with the phone number
      if (!biker) {
          biker = new Biker({ phoneNumber });
          await biker.save();
      }

      return res.status(200).json({ message: 'Biker record created/updated successfully' });
  } catch (error) {
      console.error('Error creating/updating biker record:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET request to fetch user profile details
router.get('/profile/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        // Find the biker record by phone number
        const biker = await Biker.findOne({ phoneNumber });

        if (!biker) {
            return res.status(404).json({ error: 'Biker not found' });
        }

        // Return only the necessary profile details
        const userProfile = {
            phoneNumber: biker.phoneNumber,
            name: biker.name || '', // Return empty string if name is null
            email: biker.email || '' // Return empty string if email is null
        };

        return res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST request to update user profile details (name, email)
router.post('/profile/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const { name, email } = req.body;

        // Find the biker record by phone number
        let biker = await Biker.findOne({ phoneNumber });

        if (!biker) {
            return res.status(404).json({ error: 'Biker not found' });
        }

        // Update the name and email fields
        biker.name = name;
        biker.email = email;

        // Save the updated biker record
        await biker.save();

        return res.status(200).json({ message: 'User profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


// Function to generate a 4-digit OTP containing only numbers
function generateOTP() {
  const otp = Math.floor(1000 + Math.random() * 9000); // Generate a random number between 1000 and 9999
  return otp.toString(); // Convert the number to a string
}
// Route to generate and send OTP via SMS
router.post('/generate-otp', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
  }

  // Generate a 4-digit OTP containing only numbers
  const otp = generateOTP();

  // try {
  //     // Send OTP via SMS
  //     await twilioClient.messages.create({
  //         body: `Your OTP is: ${otp}`,
  //         to: phoneNumber, // user's phone number
  //         from: '+923330319289' // your Twilio phone number
  //     });

  //     // Return success response
  //     return res.json({ message: 'OTP sent successfully' });
  // } catch (error) {
  //     console.error('Error sending OTP:', error);
  //     return res.status(500).json({ error: 'Failed to send OTP' });
  // }

  // Return the generated OTP
  return res.json({ otp });
});


// Function to calculate the distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);  // Convert degrees to radians
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1) * (Math.PI / 180)) * Math.cos((lat2) * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Route to get nearest franchisers based on biker's phone number
router.get('/nearest-franchisers/:phoneNumber', async (req, res) => {
  try {
      const { phoneNumber } = req.params;

      // Find the biker based on phone number
      const biker = await Biker.findOne({ phoneNumber });

      if (!biker) {
          return res.status(404).json({ error: 'Biker not found' });
      }

      // Ensure that the biker's location data exists and is not null
      if (!biker.location || !biker.location.coordinates) {
          return res.status(400).json({ error: 'Biker location data is missing or invalid' });
      }

      // Retrieve latitude and longitude of the biker
      const bikerLatitude = biker.location.coordinates[1];
      const bikerLongitude = biker.location.coordinates[0];

     // Find nearest franchisers based on biker's location
     const franchisers = await Franchiser.find({});

     // Calculate distances and filter nearest franchisers
     const nearestFranchisers = franchisers.filter(franchiser => {
         const distance = calculateDistance(
             bikerLatitude,
             bikerLongitude,
             franchiser.location.coordinates[1],
             franchiser.location.coordinates[0]
         );
         return distance < 500; // Considering franchisers within 500 kilometers
     });

     const simplifiedFranchisers = nearestFranchisers.map(franchiser => {
      const distance = calculateDistance(
          bikerLatitude,
          bikerLongitude,
          franchiser.location.coordinates[1],
          franchiser.location.coordinates[0]
      );
  
      return {
          name: franchiser.name,
          coordinates: franchiser.location.coordinates,
          distance: distance.toFixed(2) // Convert distance to fixed decimal places
      };
  });
  
  return res.json({ nearestFranchisers: simplifiedFranchisers });
  } catch (error) {
      console.error('Error finding nearest franchisers:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
});


// Endpoint for bikers to send swap requests to swap stations
router.post('/requestSwap', async (req, res) => {
  const { bikerPhoneNumber, franchiserPhoneNumber, batteryId } = req.body;

  try {
      // Fetch the biker ID based on the phone number
      const biker = await Biker.findOne({ phoneNumber: bikerPhoneNumber });
      if (!biker) {
          return res.status(404).json({ message: 'Biker not found' });
      }

      // Fetch the franchiser ID based on the phone number
      const franchiser = await Franchiser.findOne({ phoneNumber: franchiserPhoneNumber });
      if (!franchiser) {
          return res.status(404).json({ message: 'Franchiser not found' });
      }

      // Create a new swap request and save it to the database
      const now = new Date();
      const swapRequest = new SwapRequest({
          biker: biker._id,
          franchiser: franchiser._id,
          battery: batteryId,
          batteryStatus: '',
          request: '',
          amount: '',
          datetime: now,
      });
      await swapRequest.save();

      // Send email notification to franchiser
      const message = `Battery Swapping And Health Monitoring Application - Alert!`;
      await sendEmailNotification(franchiser.email, message);

      // Return the swap request ID as part of the response
      res.status(200).json({ message: 'A new swap request is generated', swapRequestId: swapRequest._id });

  } catch (error) {
      console.error('Error processing swap request:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Check Swap Request Status endpoint
router.get('/checkSwapRequestStatus/:swapRequestId', async (req, res) => {
  const { swapRequestId } = req.params;

  try {
      // Fetch the swap request based on the provided ID
      const swapRequest = await SwapRequest.findById(swapRequestId);
      if (!swapRequest) {
          return res.status(404).json({ message: 'Swap request not found' });
      }

     // Check if the request value is empty, then update it to "rejected"
     if (swapRequest.request === '') {
      swapRequest.request = 'rejected';
      await swapRequest.save();
  }

    // Respond accordingly based on the updated status
    if (swapRequest.request === 'accepted') {
        res.status(200).json({ message: 'Request accepted, proceed to payment' });
    } else if (swapRequest.request === 'rejected') {
        res.status(200).json({ message: 'Send request to another station' });
    }

  } catch (error) {
      console.error('Error checking swap request status:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Function to send email notification to franchiser
async function sendEmailNotification(franchiserEmail, message, token) {
  // Create a Nodemailer transporter
  const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: 'aminah30akhtar3a@gmail.com', // Your Gmail email address
          pass: 'rekk zctd wual aepq' //app password
      },
      tls: {
          rejectUnauthorized: false // Trust self-signed certificate
      }
  });

  // Email message options
  const mailOptions = {
      from: 'BSHM - Swap Request Notification <aminah30akhtar3a@gmail.com>', // Sender email address
      to: franchiserEmail, // Receiver email address
      subject: 'BSHM - Swap Request Notification',
      html: `<h4 style="color: black;">${message}</h4>
      <p style="color: black;">Dear Franshier, <br>
         A new swap request is received. Please check your application dashboard for further actions. <br>
         Thank You.<br>
         Team BSHM. </p>`
  };

  try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email notification sent:', info.response);
  } catch (error) {
      console.error('Error sending email notification:', error);
  }
}

//Verify email
// Endpoint to receive name, email, and phone number and generate a token
router.post('/register', async (req, res) => {
  try {
      const { name, email, phoneNumber } = req.body;

      // Find franchiser by phone number
      const biker = await Biker.findOne({ phoneNumber });

      if (!biker) {
          return res.status(404).json({ error: 'Biker not found' });
      }

      // Generate JWT token
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

      // Update franchiser with name, email, token, and is-email-verified flag
      await biker.updateOne({ name, email, token, is_email_verified: 0 });

      // Send email with token
      await sendVerificationEmail(email, token);

      res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to verify email by token
router.get('/verify-email/:token', async (req, res) => {
  try {
      const token = req.params.token;

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find franchiser by decoded email
      const biker = await Biker.findOne({ email: decoded.email });

      if (!biker) {
          return res.status(404).json({ error: 'Biker not found' });
      }

      // Update franchiser's is-email-verified flag to true
      await biker.updateOne({ is_email_verified: 1 });

      res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to send verification email
async function sendVerificationEmail(email, token) {
  // Create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      // Your email SMTP configuration here
      service: 'Gmail',
      auth: {
          user: 'aminah30akhtar3a@gmail.com', // Your Gmail email address
          pass: 'rekk zctd wual aepq' //app password
      },
      tls: {
          rejectUnauthorized: false // Trust self-signed certificate
      }
  });

  // Send mail with defined transport object
  let info = await transporter.sendMail({
      from: '"BSHM - Email Verification" <aminah30akhtar3a@gmail.com>',
      to: email,
      subject: 'Email Verification',
      text: `Please click the following link to verify your email: http://localhost:5000/api/biker/verify-email/${token}`,
      html: `<h4 style="color: black;">Welcome User, <br>
       Thank you for registering at BSHM (Battery Swapping And Health Monitoring Application)</h4>
      <p style="color: black;">Please click the following link to verify your email: <a href="http://localhost:5000/api/biker/verify-email/${token}">Verify Email</a></p>`
  });

  console.log('Message sent: %s', info.messageId);
}

router.get('/check-email-verification', async (req, res) => {
  try {
      const { email } = req.query;

      if (!email) {
          return res.status(400).json({ error: 'Email is required' });
      }

      // Access database to check is_email_verified
      const biker = await Biker.findOne({ email });

      if (!biker) {
          return res.status(404).json({ error: 'Biker not found' });
      }

      if (biker.is_email_verified === 0) {
          return res.status(400).json({ message: 'Please verify email' });
      } else {
          return res.status(200).json({ message: 'Email verified' });
      }
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router