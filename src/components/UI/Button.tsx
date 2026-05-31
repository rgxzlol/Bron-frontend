type ButtonProps = {
    text: string
}

const Button = ({ text }: ButtonProps) => {
    return (
        <button className="py-[16px] px-[52px] bg-[#0a6af7] text-white rounded-[10px] font-semibold w-fit whitespace-nowrap shrink-0 " >
            {text}
        </button>
    )
}

export default Button