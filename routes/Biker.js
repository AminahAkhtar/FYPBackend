const express = require('express');
const Biker = require('../models/Biker');
const router = express.Router();
const bcrypt = require('bcryptjs')
const {body, validationResult} = require('express-validator')
// const twilio = require('twilio');


var jwt = require('jsonwebtoken')
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

module.exports = router