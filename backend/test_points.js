import mongoose from 'mongoose';
import User from './models/User.js';

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/book_distribution');
    let users = await User.find({});
    console.log("Users:", users.map(u => ({ id: u._id, name: u.name, pb: u.points })));

    if (users.length > 0) {
        let u = users[0];
        await User.findByIdAndUpdate(u._id, { $inc: { points: 1 } });
        let unew = await User.findById(u._id);
        console.log("User updated, points now:", unew.points);
    }
    process.exit();
}

run().catch(console.error);
