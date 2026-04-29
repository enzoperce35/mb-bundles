import React from 'react';

const OrderModal = ({ isOpen, step, onCopy, onOpenMessenger, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl w-[90%] max-w-md text-center shadow-2xl">
        
        {/* LOADING STATE */}
        {step === "loading" && (
          <div className="py-4">
            <h2 className="text-lg font-bold mb-2 Montserrat">Preparing your order...</h2>
            <p className="text-sm text-gray-600 mb-4">Greetings! We are generating your order and uploading the image.</p>
            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
          </div>
        )}

        {/* READY STATE */}
        {step === "ready" && (
          <div className="animate-in fade-in zoom-in duration-300 text-left">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-2">🍽️</div>
              <h2 className="text-2xl font-bold text-gray-800 Montserrat">Almost there!</h2>
              <p className="text-gray-500 text-sm">Greetings! Finalize your orders with these 2 simple steps.</p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <p className="font-bold text-gray-800">Copy Order Details</p>
                  <p className="text-sm text-gray-600 mb-3">Save your selection and poster link to your clipboard.</p>
                  <button onClick={onCopy} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all active:scale-95">Copy Order</button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <p className="font-bold text-gray-800">Paste in Messenger</p>
                  <p className="text-sm text-gray-600 mb-3">Open Messenger and simply "Paste" the details to us.</p>
                  <button onClick={onOpenMessenger} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all active:scale-95">Open Messenger</button>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-full text-gray-400 text-xs text-center uppercase tracking-widest hover:text-gray-600 transition-colors">Close Instructions</button>
          </div>
        )}

        {step === "error" && (
          <div className="py-4">
            <h2 className="text-red-600 font-bold mb-4">Something went wrong</h2>
            <button onClick={onClose} className="bg-gray-800 text-white px-4 py-2 rounded-lg">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderModal;
