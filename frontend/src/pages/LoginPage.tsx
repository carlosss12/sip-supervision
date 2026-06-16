interface Props{
  email:string;
  password:string;
  setEmail:(v:string)=>void;
  setPassword:(v:string)=>void;
  loginError:string;
  handleLogin:(e:any)=>void;
}

export default function LoginPage({
  email,
  password,
  setEmail,
  setPassword,
  loginError,
  handleLogin
}:Props){

  return(
    <div className="login-container">

      <form
        className="login-card"
        onSubmit={handleLogin}
      >

        <h2>
          Sistema de Supervisión
        </h2>

        <input
          className="form-control-sip"
          placeholder="Correo"
          value={email}
          onChange={(e)=>
            setEmail(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="password"
          className="form-control-sip"
          placeholder="Contraseña"
          value={password}
          onChange={(e)=>
            setPassword(e.target.value)
          }
        />

        <br />
        <br />

        {loginError && (
          <p>{loginError}</p>
        )}

        <button
          className="btn-primary-sip"
        >
          Iniciar sesión
        </button>

      </form>

    </div>
  );
}