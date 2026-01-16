import SearchBar from "./components/SearchBar"
import Carousel from "./components/Carousel"
import Categories from "./components/Categories"
import Deals from "./components/Deals"
import AllProductsGrid from "./components/AllProductsGrid"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
export default async function page ({searchParams}:{searchParams: Promise<{query?:string}>}){
    const session = await getServerSession(authOptions);
  return (
        <main>
            <SearchBar/>
            {/* <div className="relative md:px-20 md:py-5 px-4 py-10 md:mt-10 ">
                <div className=" bg-primary md:px-10 md:py-10 py-5 px-5 w-fit rounded-2xl">
                    <div className="font-brasika flex flex-col justify-start md:w-12/20 w-1/2 md:gap-5 gap-2">
                        <p className="text-accents text-md md:text-2xl lg:text-3xl tracking-wide leading-snug w-fit">Satisfy Your Snack and Sweet Cravings with Cravio</p>
                        <div className="md:py-5 md:px-3 py-3 px-1 text-center bg-secondary text-accents md:text-md lg:text-lg 
                        md:w-11/20 text-xs  rounded-xl">
                            {session?"Explore Snacks":"Sign Up to Place an Order"}
                        </div>
                    </div>
                        <img src="./images/hero1.jpeg" className="md:h-50 md:w-50 h-30 w-30 absolute lg:top-1 lg:right-50 top-5 right-23 shadow-[10px_-13px_10px_rgba(0,0,0,0.15)] z-1 rounded-2xl"/>
                        <img src="./images/hero2.jpeg" className="md:h-50 md:w-50 h-30 w-30 absolute lg:top-30 lg:right-25 bottom-[20] right-8 shadow-[10px_13px_10px_rgba(0,0,0,0.15)] z-0 rounded-2xl "/>
                    </div>
            </div> */}
            <Carousel></Carousel>
            <Categories/>
            <Deals Name="Hot Deals - On the Clock"/>
            <AllProductsGrid/>
        </main>
  )
}
