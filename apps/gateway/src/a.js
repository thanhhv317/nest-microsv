
const phoneSwap = [
    {
        old: "016",
        new: "03"
    },
    {
        old: "0120",
        new: "070"
    },
    {
        old: "0121",
        new: "079"
    },
    {
        old: "0122",
        new: "077"
    },
    {
        old: "0126",
        new: "076"
    },
    {
        old: "0128",
        new: "078"
    },
    {
        old: "0123",
        new: "083"
    },
    {
        old: "0124",
        new: "084"
    },
    {
        old: "0125",
        new: "084"
    },
    {
        old: "0127",
        new: "081"
    },
    {
        old: "0129",
        new: "082"
    },
    {
        old: "0188",
        new: "058"
    },
    {
        old: "0186",
        new: "056"
    },
    {
        old: "0199",
        new: "059"
    }
  ];
  
  
  const convert10To11 = (phone) => {
    let result = '';
    for(let i =0; i< phoneSwap.length; ++i) {
        const regex = new RegExp(`^${phoneSwap[i].new}[0-9]`, 'g');
        if (regex.test(phone)) {
            result = phone.replace(phoneSwap[i].new, phoneSwap[i].old);
            return result;
        }
    }
    return phone;
  }


  console.log(convert10To11("0888699993"))