import React, { createContext, useState, useContext } from 'react';
import DonateModal from '../components/DonateModal/DonateModal.jsx';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      <DonateModal isOpen={isModalOpen} onClose={closeModal} />
    </ModalContext.Provider>
  );
};
