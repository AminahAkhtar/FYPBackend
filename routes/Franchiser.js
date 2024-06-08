const express = require('express');
const Franchiser = require('../models/Franchiser');
const Battery = require('../models/Battery');
const SwapRequest = require('../models/SwapRequest');
const router = express.Router();
const bcrypt = require('bcryptjs')
const {body, validationResult} = require('express-validator')
const jwt = require('jsonwebtoken'); 
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


// var fetchuser = require('../middleware/fetchuser')
const JWT_SECRET = 'bshm'



router.post('/registerfranchiser', [
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


  let user = await Franchiser.findOne({email: req.body.email});
  if (user) {
    return res.status(400).json({success,error :"Email already exists"})
  }

  const salt = await bcrypt.genSalt(10);
  const secPass = await  bcrypt.hash(req.body.password,salt);
  //create new user
  user = await Franchiser.create({
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
     let user = await Franchiser.findOne({email});
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


//otp 
// Route to handle phone number and OTP
router.post('/otpregister', async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    
      // Create a new biker document
      let franchiser = new Franchiser({ phoneNumber, otp });
      

      // Save to the database
      await franchiser.save();

      res.status(201).json({ message: 'Franchiser registered successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
  }
});

// Route to check if there is an OTP against a phone number
router.get('/check/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;

  try {
      const franchiser = await Franchiser.findOne({ phoneNumber });

      if (franchiser && franchiser.otp) {
          res.status(200).json({ message: 'Registered user', biker });
      } else {
          res.status(200).json({ message: 'Not registered user' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
  }
});

router.post('/swap-station', async (req, res) => {
  try {
      const { phoneNumber } = req.body;
      const totalBatteries = 9; 
      const availableBatteries = 9; 

      // Check if the biker with the provided phone number already exists
      let franchiser = await Franchiser.findOne({ phoneNumber});

      // If the biker doesn't exist, create a new record with the phone number
      if (!franchiser) {
          franchiser = new Franchiser({ phoneNumber, totalBatteries, availableBatteries  });
          await franchiser.save();
      }

      return res.status(200).json({ message: 'Franchiser record created/updated successfully' });
  } catch (error) {
      console.error('Error creating/updating franchiser record:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET request to fetch user profile details
router.get('/profile/:phoneNumber', async (req, res) => {
  try {
      const { phoneNumber } = req.params;

      // Find the biker record by phone number
      const franchiser = await Franchiser.findOne({ phoneNumber });

      if (!franchiser ) {
          return res.status(404).json({ error: 'Biker not found' });
      }

      // Return only the necessary profile details
      const userProfile = {
          phoneNumber:  franchiser.phoneNumber,
          name:  franchiser.name || '', // Return empty string if name is null
          email:  franchiser.email || '' // Return empty string if email is null
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
      let  franchiser  = await  Franchiser.findOne({ phoneNumber });

      if (!franchiser ) {
          return res.status(404).json({ error: 'Biker not found' });
      }

      // Update the name and email fields
      franchiser.name = name;
      franchiser.email = email;

      // Save the updated biker record
      await  franchiser.save();

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

//Register A Battery
// Endpoint to register a new battery
router.post('/registerBattery', async (req, res) => {
  const { franchiserPhoneNumber, battery_number, price, status } = req.body;

  try {
      // Fetch the franchiser ID based on the phone number
      const franchiser = await Franchiser.findOne({ phoneNumber: franchiserPhoneNumber });
      if (!franchiser) {
          return res.status(404).json({ message: 'Franchiser not found' });
      }

      // Create a new battery entry
      const battery = new Battery({
          battery_number,
          franchiser: franchiser._id,
          price,
          status
      });
      await battery.save();

      // Update the total and available batteries count of the franchiser
      await Franchiser.findByIdAndUpdate(franchiser._id, { $inc: { availableBatteries: 1 } });

      res.status(200).json({ message: 'Battery registered successfully' });
  } catch (error) {
      console.error('Error registering battery:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

//change battery status
// PUT route to update battery status by ID
router.put('/updateBatteryStatus/:batteryId', async (req, res) => {
    const { battery_number } = req.params;
    const { status } = req.body;

    try {
        // Find the battery by ID
        const battery = await Battery.findById(battery_number);
        if (!battery) {
            return res.status(404).json({ message: 'Battery not found' });
        }

        // Update the battery status
        battery.status = status;
        await battery.save();

        res.status(200).json({ message: 'Battery status updated successfully', battery });
    } catch (error) {
        console.error('Error updating battery status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//Display all batteries of a franchiser
// API endpoint to display all batteries based on franchiser id
router.get('/batteries/:franchiserPhoneNumber', async (req, res) => {
  try {
      const { franchiserPhoneNumber } = req.params;

      // Find franchiser by phone number
      const franchiser = await Franchiser.findOne({ phoneNumber: franchiserPhoneNumber });

      if (!franchiser) {
          return res.status(404).json({ error: 'Franchiser not found' });
      }

      // Find batteries associated with the franchiser
      const batteries = await Battery.find({ franchiserId: franchiser._id });

      res.status(200).json({ batteries });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to receive name, email, and phone number and generate a token
router.post('/register', async (req, res) => {
  try {
      const { name, email, phoneNumber } = req.body;

      // Find franchiser by phone number
      const franchiser = await Franchiser.findOne({ phoneNumber });

      if (!franchiser) {
          return res.status(404).json({ error: 'Franchiser not found' });
      }

      // Generate JWT token
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

      // Update franchiser with name, email, token, and is-email-verified flag
      await franchiser.updateOne({ name, email, token, is_email_verified: 0 });

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
      const franchiser = await Franchiser.findOne({ email: decoded.email });

      if (!franchiser) {
          return res.status(404).json({ error: 'Franchiser not found' });
      }

      // Update franchiser's is-email-verified flag to true
      await franchiser.updateOne({ is_email_verified: 1 });

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
      text: `Please click the following link to verify your email: http://localhost:5000/api/franchiser/verify-email/${token}`,
      html: `<h4 style="color: black;">Welcome User, <br>
      Thank you for registering at BSHM (Battery Swapping And Health Monitoring Application)</h4>
      <p style="color: black;">Please click the following link to verify your email: <a href="http://localhost:5000/api/franchiser/verify-email/${token}">Verify Email</a></p>`
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
      const franchiser = await Franchiser.findOne({ email });

      if (!franchiser) {
          return res.status(404).json({ error: 'Franchiser not found' });
      }

      if (franchiser.is_email_verified === 0) {
          return res.status(400).json({ message: 'Please verify email' });
      } else {
          return res.status(200).json({ message: 'Email verified' });
      }
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
// view all recieved swap request
router.get('/view-all-request/:franchiserPhoneNumber', async (req, res) => {
  try {
      const { franchiserPhoneNumber } = req.params;

      // Find franchiser by phone number
      const franchiser = await Franchiser.findOne({ phoneNumber: franchiserPhoneNumber });

      if (!franchiser) {
          return res.status(404).json({ error: 'Franchiser not found' });
      }

      // Find all swap requests associated with the franchiser ID
      const swapRequests = await SwapRequest.find({ franchiser: franchiser._id });

      res.status(200).json({ swapRequests });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
router.put('/accept-swap-request/:swapRequestId', async (req, res) => {
  try {
      const { swapRequestId } = req.params;

      // Find the swap request by ID
      const swapRequest = await SwapRequest.findById(swapRequestId);

      if (!swapRequest) {
          return res.status(404).json({ error: 'Swap request not found' });
      }

      // Update the swap request status to "accepted"
      swapRequest.request = 'accepted';
      swapRequest.batteryStatus = 'reserved';
      await swapRequest.save();

      // Get the franchiser ID from the swap request
      const franchiserId = swapRequest.franchiser;

      // Deduct one from the availableBatteries field of the associated franchiser
      const franchiser = await Franchiser.findById(franchiserId);
      if (!franchiser) {
          return res.status(404).json({ error: 'Franchiser not found' });
      }
      franchiser.availableBatteries -= 1;
      await franchiser.save();

      res.status(200).json({ message: 'Swap request status updated to accepted', batteryStatus: 'reserved' });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
router.put('/reject-swap-request/:swapRequestId', async (req, res) => {
  try {
      const { swapRequestId } = req.params;

      // Find the swap request by ID
      const swapRequest = await SwapRequest.findById(swapRequestId);

      if (!swapRequest) {
          return res.status(404).json({ error: 'Swap request not found' });
      }

      // Update the swap request status to "accepted"
      swapRequest.request = 'rejected';
      await swapRequest.save();

      res.status(200).json({ message: 'Swap request status updated to rejected' });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});



router.put('/accept-swap-request-socket/:swapRequestId', async (req, res) => {
    try {
        const { swapRequestId } = req.params;
  
        // Find the swap request by ID
        const swapRequest = await SwapRequest.findById(swapRequestId);
  
        if (!swapRequest) {
            return res.status(404).json({ error: 'Swap request not found' });
        }
  
        // Update the swap request status to "accepted"
        swapRequest.request = 'accepted';
        swapRequest.batteryStatus = 'reserved';
        await swapRequest.save();
  
        // Get the franchiser ID from the swap request
        const franchiserId = swapRequest.franchiser;
  
        // Deduct one from the availableBatteries field of the associated franchiser
        const franchiser = await Franchiser.findById(franchiserId);
        if (!franchiser) {
            return res.status(404).json({ error: 'Franchiser not found' });
        }
        franchiser.availableBatteries -= 1;
        await franchiser.save();
  
        // Emit event to notify the biker
        const io = req.app.get('io');
        io.emit('swapRequestAccepted', franchiserId);
  
        res.status(200).json({ message: 'Swap request status updated to accepted', batteryStatus: 'reserved' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  });


  router.put('/reject-swap-request-socket/:swapRequestId', async (req, res) => {
    try {
        const { swapRequestId } = req.params;
  
        // Find the swap request by ID
        const swapRequest = await SwapRequest.findById(swapRequestId);
  
        if (!swapRequest) {
            return res.status(404).json({ error: 'Swap request not found' });
        }

        // Get the franchiser ID from the swap request
        const franchiserId = swapRequest.franchiser;
  
        // Update the swap request status to "accepted"
        swapRequest.request = 'rejected';
        await swapRequest.save();

         // Emit event to notify the biker
         const io = req.app.get('io');
         io.emit('swapRequestRejected', franchiserId);
  
        res.status(200).json({ message: 'Swap request status updated to rejected' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  
module.exports = router