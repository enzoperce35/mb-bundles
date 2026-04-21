import PaxSelector from './components/PaxSelector';

function App() {
  const handlePaxSelect = (id) => {
    console.log("Selected Category:", id);
    // Logic to navigate to the Bundle List for this category
  };

  return (
    <div className="App">
      <PaxSelector onSelect={handlePaxSelect} />
    </div>
  );
}

export default App;
