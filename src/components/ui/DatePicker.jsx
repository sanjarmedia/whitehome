import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useOutletContext } from 'react-router-dom';

// Custom header for the calendar
const CustomHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
    darkMode
}) => (
    <div className={`flex items-center justify-between px-2 py-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
        <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronLeft size={18} />
        </button>

        <div className="font-semibold text-sm capitalize">
            {date.toLocaleString('uz-UZ', { month: 'long', year: 'numeric' })}
        </div>

        <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronRight size={18} />
        </button>
    </div>
);

const CustomDatePicker = ({ selected, onChange, placeholder, darkMode }) => {
    return (
        <div className="relative w-full cursor-pointer">
            <DatePicker
                selected={selected}
                onChange={onChange}
                dateFormat="dd.MM.yyyy"
                placeholderText={placeholder}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer ${darkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                calendarClassName={darkMode ? "dark-calendar" : "light-calendar"}
                renderCustomHeader={(props) => <CustomHeader {...props} darkMode={darkMode} />}
                dayClassName={(date) =>
                    darkMode ? "dark-day" : "light-day"
                }
            />
            <CalendarIcon
                className={`absolute left-3 top-2.5 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                size={18}
            />

            {/* Inject Custom Styles to Override Default CSS */}
            <style>{`
                .react-datepicker {
                    font-family: inherit;
                    border: 1px solid ${darkMode ? '#334155' : '#e2e8f0'};
                    border-radius: 0.75rem;
                    background-color: ${darkMode ? '#1e293b' : '#ffffff'};
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                }
                .react-datepicker__header {
                    background-color: ${darkMode ? '#1e293b' : '#ffffff'};
                    border-bottom: 1px solid ${darkMode ? '#334155' : '#f1f5f9'};
                    padding-top: 0;
                }
                .react-datepicker__day-name {
                    color: ${darkMode ? '#94a3b8' : '#64748b'};
                    width: 2.5rem;
                    line-height: 2.5rem;
                    margin: 0;
                }
                .react-datepicker__day {
                    width: 2.5rem;
                    line-height: 2.5rem;
                    margin: 0;
                    border-radius: 9999px;
                    color: ${darkMode ? '#e2e8f0' : '#334155'};
                }
                .react-datepicker__day:hover,
                .react-datepicker__day--keyboard-selected:hover {
                    background-color: ${darkMode ? '#334155' : '#e2e8f0'} !important;
                    color: ${darkMode ? '#ffffff' : '#0f172a'} !important;
                }
                .react-datepicker__day--selected, 
                .react-datepicker__day--selected:hover {
                    background-color: #3b82f6 !important;
                    color: #ffffff !important;
                    font-weight: bold;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: transparent; 
                    color: ${darkMode ? '#e2e8f0' : '#334155'};
                }
                .react-datepicker__month-text--keyboard-selected {
                    background-color: #3b82f6;
                    color: #fff;
                }
                .react-datepicker__triangle {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default CustomDatePicker;
