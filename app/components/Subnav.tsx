import Link from "next/link";

const Subnav: React.FC = () => {
  return (
    <div className="w-full h-auto py-3 px-3 hidden md:flex flex-row bg-secondary gap-3">
        <div className="flex flex-row gap-2 px-2 py-2 items-center">
            <img src="/images/take-away.png" className="w-10 h-10"/>
            <p className="font-sifonn text-accents">Delivery</p>
        </div>
        <Link href="/companies">
          <div className="flex flex-row gap-2 px-2 py-2 items-center">
              <img src="/images/brand.png" className="w-10 h-10"/>
              <p className="font-sifonn text-accents">Companies</p>
          </div>
        </Link>
    </div>
  )
}

export default Subnav;