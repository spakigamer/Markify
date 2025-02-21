import React from "react";
import Nav from "./Navbar/nav";
import Footer from "./Navbar/footer";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import axios from "axios";
import './Contact.css';

function SignUp() {
    const { register, handleSubmit,formState:{errors},getValues } = useForm();

    // Define the form submit function
    const handleGoogleLogin = async() => {
        window.location.href = "http://localhost:3000/auth/google";
    };  

const onSubmit = async (data) => {
    console.log(data)
    try {
        const response = await axios.post("http://localhost:3000/register", {
            name: data.name,
            email: data.email,
            password: data.Password
        });

        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            alert("Registration successful!");
            <Navigate to='/dashboard'/>;
        }
    } catch (error) {
        console.error("Registration failed:", error.response?.data || error.message);
        alert("Error during registration.");
    }
};

    return (
        <div >
            <Nav />
            <div style={{ paddingTop: '100px', paddingBottom: '100px' }} className="flex justify-center flex-col items-center bg-[#57636F] w-full">
                <div className="w-2/5 flex flex-col bg-[#323F4A] items-center rounded-2xl  ">
                <h1 style={{padding:'1rem'}} className="text-[4rem] text-[#4DE4EC]">Sign UP</h1>
                <form 
                    style={{ paddingBottom: '30px' }} 
                    className="flex flex-col gap-5 bg-[#323F4A] w-full items-center rounded-2xl" 
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <label>
                        <h1 style={{ fontSize: "1.5rem" }} className="text-[#4DE4EC]">Name</h1>
                        <input 
                            type="text" 
                            {...register('name', { required: true, maxLength: 150 })} 
                            placeholder="Name" 
                            className="border-b" 
                        />
                    </label>
                    {errors.name &&<div><span style={{color:'red'}} >It is a required field</span>{console.log(errors.name)}</div>}

                    <label>
                        <h1 style={{ fontSize: "1.5rem" }} className="text-[#4DE4EC]">Email</h1>
                        <input 
                            type="email" 
                            {...register('email', { required: true, maxLength: 100 })} 
                            placeholder="Email" 
                            className="border-b" 
                        />
                    </label>
                    {errors.email &&<div><span style={{color:'red'}} >It is a required field</span>{console.log(errors.name)}</div>}

                    <label>
                        <h1 style={{ fontSize: "1.5rem" }} className="text-[#4DE4EC]">Password</h1>
                        <input 
                            type="text" 
                            {...register('Password', { required: true })}  
                            placeholder="Password" 
                            className="border-b" 
                        />
                    </label>
                    {errors.topic &&<div><span style={{color:'red'}} >It is a required field</span>{console.log(errors.name)}</div>}

                    <label>
                        <h1 style={{ fontSize: "1.5rem" }} className="text-[#4DE4EC]">Confirm password</h1>
                        <input 
                            type="text" 
                            {...register('Confirmpassword', { required: 'Confirm the password',validate:value=>{
                                value === getValues("password") && "Passwords do not match"
                            }})}  
                            placeholder="Problem" 
                            className="border-b" 
                        />
                    </label>
                    {errors.topic &&<div><span style={{color:'red'}} >It is a required field</span>{console.log(errors.name)}</div>}

                    <button 
                        style={{ textShadow: '2px 2px black' }} 
                        className="w-20 rounded-2xl bg-[#4DE4EC] text-white cursor-pointer" 
                        type="submit"
                    >
                        Submit
                    </button>
                </form>
                <div className=" border-white border w-4/6"></div>
                <div style={{margin:'1rem'}} onClick={handleGoogleLogin} className="bg-white w-2/5 gap-2 flex flex-row items-center justify-center h-9 rounded-2xl cursor-pointer"><svg className="w-[1rem]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg><h1>Login with Google</h1></div>
                </div>
                <Link to='/login' className="text-blue-500 hover:text-blue-100">Login</Link>

            </div>
            <Footer />
        </div>
    );
}

export default SignUp;
