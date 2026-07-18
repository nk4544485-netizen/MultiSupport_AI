function ShellCard({ children, className = "", style = {} }) {
    return (
        <div className={`shell-card ${className}`.trim()} style={style}>
            {children}
        </div>
    );
}

export default ShellCard;
