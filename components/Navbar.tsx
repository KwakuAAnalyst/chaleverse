import Image from "next/image";
import Link from "next/link";


const Navbar = () => {
    return (
      <header>  
        <nav>
            <Link href='/' className="logo">
                <Image src="/icons/logo.png" alt="Logo" width={24} height={24} />
                <p>ChaleVerse</p>
            </Link>
            <ul>
                <li>Home</li>
                <li>About</li>
                <li>Events</li>
            </ul>
        </nav>
      </header>  
    );
};

export default Navbar;
