import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom";

export default function Error(){

  const navigate = useNavigate();

  useEffect(() => {
    navigate("/session");
  }, []);

  return (
    <div className='main'>
        <p className="url-adress-error-message">404</p>
        <p className="url-adress-error-message">Siden finnes ikke.</p>
    </div>
  )
}

